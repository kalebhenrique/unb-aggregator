import fs from 'node:fs/promises';
import path from 'node:path';
import {
  CookieJar,
  USER_AGENT,
  decodeHtmlEntities,
  parseScheduleCode,
  parseScheduleField,
  fetchWithRetry,
  type ScheduleSlot,
} from './utils.ts';

export interface Department {
  id: string;
  name: string;
}

export interface ScrapedClass {
  id: string;
  discipline_code: string;
  discipline_name: string;
  class_code: string;
  teachers: string[];
  classroom: string;
  schedule_code: string;
  schedule_description?: string;
  date_range?: string;
  schedule_slots: ScheduleSlot[];
  vacancies?: number;
  occupied?: number;
}

export interface ScrapedDiscipline {
  code: string;
  name: string;
  department_id: string;
  classes: ScrapedClass[];
}

const SIGAA_HOME_URL = 'https://sigaa.unb.br/sigaa/public/home.jsf';
const SIGAA_TURMAS_URL = 'https://sigaa.unb.br/sigaa/public/turmas/listar.jsf?aba=p-ensino';
const SIGAA_POST_URL = 'https://sigaa.unb.br/sigaa/public/turmas/listar.jsf';

export class GradeScraper {
  private jar = new CookieJar();

  async initSession(): Promise<string> {
    const resHome = await fetchWithRetry(SIGAA_HOME_URL, {
      headers: { 'User-Agent': USER_AGENT },
    });
    this.jar.update(resHome.headers);

    const resTurmas = await fetchWithRetry(SIGAA_TURMAS_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: this.jar.header(),
        Referer: SIGAA_HOME_URL,
      },
    });
    this.jar.update(resTurmas.headers);
    return resTurmas.text();
  }

  parseDepartments(html: string): Department[] {
    const selectMatch = html.match(/<select[^>]+name="formTurma:inputDepto"[^>]*>([\s\S]*?)<\/select>/i);
    if (!selectMatch) return [];

    const optionRegex = /<option[^>]+value="([^"]+)"[^>]*>([^<]+)<\/option>/g;
    const departments: Department[] = [];
    let m: RegExpExecArray | null;

    while ((m = optionRegex.exec(selectMatch[1])) !== null) {
      const id = m[1].trim();
      const name = decodeHtmlEntities(m[2].trim());
      if (id && id !== '0' && name) {
        departments.push({ id, name });
      }
    }

    return departments;
  }

  async scrapeDepartment(
    deptId: string,
    year: string,
    period: string,
    initialHtml?: string
  ): Promise<ScrapedDiscipline[]> {
    let html = initialHtml;
    if (!html) {
      html = await this.initSession();
    }

    const vsMatch = html.match(/name="javax\.faces\.ViewState"[^>]*value="([^"]+)"/i);
    const viewState = vsMatch ? vsMatch[1] : 'j_id1';

    let btnName = 'formTurma:j_id_jsp_1370969402_11';
    const btnMatch =
      html.match(/<input[^>]+name="([^"]+)"[^>]+value="Buscar"/i) ||
      html.match(/<input[^>]+value="Buscar"[^>]+name="([^"]+)"/i);
    if (btnMatch) {
      btnName = btnMatch[1];
    }

    const body = new URLSearchParams({
      formTurma: 'formTurma',
      'formTurma:inputNivel': '',
      'formTurma:inputDepto': deptId,
      'formTurma:inputAno': year,
      'formTurma:inputPeriodo': period,
      [btnName]: 'Buscar',
      'javax.faces.ViewState': viewState,
    });

    const res = await fetchWithRetry(SIGAA_POST_URL, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        Cookie: this.jar.header(),
        Referer: SIGAA_TURMAS_URL,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    this.jar.update(res.headers);

    const postHtml = await res.text();
    return this.parseClassesTable(postHtml, deptId);
  }

  parseClassesTable(html: string, deptId: string): ScrapedDiscipline[] {
    const tableMatch = html.match(/<table[^>]+class="listagem"[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) return [];

    const tableHtml = tableMatch[1];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    const disciplines: ScrapedDiscipline[] = [];

    let currentCode = '';
    let currentName = '';
    let currentClasses: ScrapedClass[] = [];

    let rowMatch: RegExpExecArray | null;
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowContent = rowMatch[1];

      // Título da disciplina
      const titleMatch = rowContent.match(/<span[^>]+class="tituloDisciplina"[^>]*>([\s\S]*?)<\/span>/i);
      if (titleMatch) {
        if (currentCode && currentClasses.length > 0) {
          disciplines.push({
            code: currentCode,
            name: currentName,
            department_id: deptId,
            classes: currentClasses,
          });
          currentClasses = [];
        }

        const rawTitle = decodeHtmlEntities(titleMatch[1]);
        const cleanTitle = rawTitle.replace(/^[-–—\s]+|[-–—\s]+$/g, '');
        const parts = cleanTitle.split(/\s*[-–—]\s*/);
        if (parts.length >= 2) {
          currentCode = parts[0].trim();
          currentName = parts[1].replace(/\s*\(\d+h\).*$/i, '').trim();
        } else {
          currentCode = cleanTitle.trim();
          currentName = cleanTitle.trim();
        }
        continue;
      }

      // Linha de turma (linhaPar / linhaImpar)
      if (rowMatch[0].includes('linhaPar') || rowMatch[0].includes('linhaImpar')) {
        const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
        const tds: string[] = [];
        let tdMatch: RegExpExecArray | null;
        while ((tdMatch = tdRegex.exec(rowContent)) !== null) {
          tds.push(decodeHtmlEntities(tdMatch[1]));
        }

        if (tds.length >= 4) {
          const classCode = tds[0].replace(/<[^>]+>/g, '').trim();
          const teachersRaw = tds[2].replace(/<[^>]+>/g, '').trim();
          const scheduleRaw = tds[3].replace(/<[^>]+>/g, '').trim();
          const classroom = tds.length >= 8 ? tds[7].replace(/<[^>]+>/g, '').trim() || 'A definir' : 'A definir';

          const vacancies = tds[4] ? parseInt(tds[4].replace(/<[^>]+>/g, '').trim(), 10) : undefined;
          const occupied = tds[5] ? parseInt(tds[5].replace(/<[^>]+>/g, '').trim(), 10) : undefined;

          // Professores
          const teachers = teachersRaw
            .split(')')
            .map((p) => p.split('(')[0].trim())
            .filter((p) => p.length > 0);

          const { schedule_code, date_range, schedule_description } = parseScheduleField(scheduleRaw);
          const schedule_slots = parseScheduleCode(schedule_code);

          const sc: ScrapedClass = {
            id: `${currentCode}-${classCode}`,
            discipline_code: currentCode,
            discipline_name: currentName,
            class_code: classCode,
            teachers: teachers.length > 0 ? teachers : ['A definir'],
            classroom,
            schedule_code,
            schedule_description,
            date_range,
            schedule_slots,
            vacancies: isNaN(vacancies || NaN) ? undefined : vacancies,
            occupied: isNaN(occupied || NaN) ? undefined : occupied,
          };

          currentClasses.push(sc);
        }
      }
    }

    if (currentCode && currentClasses.length > 0) {
      disciplines.push({
        code: currentCode,
        name: currentName,
        department_id: deptId,
        classes: currentClasses,
      });
    }

    return disciplines;
  }
}

// Fallback seed departments
export const FALLBACK_DEPARTMENTS: Department[] = [
  { id: '508', name: 'DEPTO CIÊNCIAS DA COMPUTAÇÃO - CIC' },
  { id: '518', name: 'DEPARTAMENTO DE MATEMÁTICA - MAT' },
  { id: '514', name: 'DEPTO ESTATÍSTICA - EST' },
  { id: '443', name: 'DEPTO ENGENHARIA ELÉTRICA - ENE' },
  { id: '449', name: 'DEPARTAMENTO DE ENGENHARIA MECÂNICA - ENM' },
  { id: '440', name: 'DEPARTAMENTO DE ENGENHARIA CIVIL E AMBIENTAL - ENC' },
  { id: '524', name: 'INSTITUTO DE FÍSICA - IF' },
  { id: '610', name: 'INSTITUTO DE QUÍMICA - IQ' },
  { id: '327', name: 'DEPTO ADMINISTRAÇÃO - ADM' },
  { id: '333', name: 'DEPTO CIÊNCIAS CONTÁBEIS ATUARIAIS - CCA' },
  { id: '335', name: 'DEPTO ECONOMIA - ECO' },
  { id: '673', name: 'CAMPUS UNB GAMA - FGA' },
  { id: '672', name: 'CAMPUS UNB CEILÂNDIA - FCE' },
  { id: '675', name: 'CAMPUS UNB PLANALTINA - FUP' },
  { id: '401', name: 'FACULDADE DE DIREITO - FD' },
  { id: '379', name: 'FACULDADE DE MEDICINA - FM' },
];

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string, def: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : def;
  };

  const year = getArg('--year', process.env.SCRAPER_YEAR || '2026');
  const period = getArg('--period', process.env.SCRAPER_PERIOD || '2');
  const outDir = path.resolve(getArg('--out-dir', process.env.OUTPUT_DIR || './data'));
  const targetDept = getArg('--dept', '');
  const limitStr = getArg('--limit', '');
  const limit = limitStr ? parseInt(limitStr, 10) : undefined;

  console.log(`[GradeScraper] Iniciando coleta de turmas: ano=${year}, período=${period}`);
  console.log(`[GradeScraper] Diretório de saída: ${outDir}`);

  await fs.mkdir(outDir, { recursive: true });

  const scraper = new GradeScraper();
  let departments: Department[] = [];

  try {
    const initialHtml = await scraper.initSession();
    departments = scraper.parseDepartments(initialHtml);
    console.log(`[GradeScraper] ${departments.length} departamentos obtidos do SIGAA.`);
  } catch (err) {
    console.warn(`[GradeScraper] Falha ao coletar lista ao vivo de departamentos: ${err}. Usando fallback.`);
    departments = FALLBACK_DEPARTMENTS;
  }

  if (departments.length === 0) {
    departments = FALLBACK_DEPARTMENTS;
  }

  // Salva departamentos
  const deptPath = path.join(outDir, 'departments.json');
  await fs.writeFile(deptPath, JSON.stringify(departments, null, 2), 'utf-8');
  console.log(`[GradeScraper] Salvo: ${deptPath} (${departments.length} registros)`);

  let deptsToScrape = targetDept ? departments.filter((d) => d.id === targetDept) : departments;
  if (limit && limit > 0) {
    deptsToScrape = deptsToScrape.slice(0, limit);
  }

  console.log(`[GradeScraper] Coletando turmas para ${deptsToScrape.length} departamentos...`);

  const allDisciplines: ScrapedDiscipline[] = [];
  let processed = 0;

  for (const dept of deptsToScrape) {
    try {
      const disciplines = await scraper.scrapeDepartment(dept.id, year, period);
      allDisciplines.push(...disciplines);
      processed++;
      if (disciplines.length > 0) {
        console.log(`[GradeScraper] [${processed}/${deptsToScrape.length}] ${dept.name} (${dept.id}): ${disciplines.length} disciplinas.`);
      }
    } catch (e) {
      console.warn(`[GradeScraper] Erro ao raspar depto ${dept.id} (${dept.name}):`, e);
    }
    // Breve pausa para não sobrecarregar o servidor do SIGAA
    await new Promise((r) => setTimeout(r, 200));
  }

  const classesPath = path.join(outDir, 'classes.json');
  await fs.writeFile(classesPath, JSON.stringify(allDisciplines, null, 2), 'utf-8');
  console.log(`[GradeScraper] Salvo: ${classesPath} (${allDisciplines.length} disciplinas coletadas)`);

  const metaPath = path.join(outDir, 'grade-meta.json');
  const meta = {
    scraped_at: new Date().toISOString(),
    year,
    period,
    total_departments: departments.length,
    total_disciplines: allDisciplines.length,
    total_classes: allDisciplines.reduce((acc, d) => acc + d.classes.length, 0),
  };
  await fs.writeFile(metaPath, JSON.stringify(meta, null, 2), 'utf-8');
  console.log(`[GradeScraper] Concluído com sucesso! Metadados em ${metaPath}`);

  // Sincroniza cópia para public/data/ para desenvolvimento local transparente
  const publicDataDir = path.resolve('public', 'data');
  if (path.resolve(outDir) !== publicDataDir) {
    try {
      await fs.mkdir(publicDataDir, { recursive: true });
      await fs.copyFile(classesPath, path.join(publicDataDir, 'classes.json'));
      await fs.copyFile(deptPath, path.join(publicDataDir, 'departments.json'));
      await fs.copyFile(metaPath, path.join(publicDataDir, 'grade-meta.json'));
      console.log(`[GradeScraper] Sincronizado para ${publicDataDir}`);
    } catch {}
  }
}

// Execução se chamado diretamente via CLI
if (process.argv[1] && process.argv[1].endsWith('grade-scraper.ts')) {
  main().catch((err) => {
    console.error('[GradeScraper] Falha fatal:', err);
    process.exit(1);
  });
}
