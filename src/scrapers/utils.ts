/**
 * Utilitários compartilhados para os scrapers standalone do SIGAA UnB.
 */

export interface ScheduleSlot {
  day: number;
  day_name: string;
  shift: 'M' | 'T' | 'N';
  period: number;
  time_range: string;
  global_slot_index: number;
}

export class CookieJar {
  private cookies = new Map<string, string>();

  update(headers: Headers): void {
    const raw = typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : [headers.get('set-cookie') || ''];

    for (const line of raw) {
      if (!line) continue;
      for (const part of line.split(/,(?=[^;]+=[^;]+)/)) {
        const [pair] = part.trim().split(';');
        const eqIdx = pair.indexOf('=');
        if (eqIdx > 0) {
          const key = pair.substring(0, eqIdx).trim();
          const val = pair.substring(eqIdx + 1).trim();
          if (val && val !== 'deleted') {
            this.cookies.set(key, val);
          }
        }
      }
    }
  }

  header(): string {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }
}

export const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const ENTITY_MAP: Record<string, string> = {
  '&#193;': 'Á', '&Aacute;': 'Á',
  '&#225;': 'á', '&aacute;': 'á',
  '&#192;': 'À', '&Agrave;': 'À',
  '&#224;': 'à', '&agrave;': 'à',
  '&#194;': 'Â', '&Acirc;': 'Â',
  '&#226;': 'â', '&acirc;': 'â',
  '&#195;': 'Ã', '&Atilde;': 'Ã',
  '&#227;': 'ã', '&atilde;': 'ã',
  '&#201;': 'É', '&Eacute;': 'É',
  '&#233;': 'é', '&eacute;': 'é',
  '&#202;': 'Ê', '&Ecirc;': 'Ê',
  '&#234;': 'ê', '&ecirc;': 'ê',
  '&#205;': 'Í', '&Iacute;': 'Í',
  '&#237;': 'í', '&iacute;': 'í',
  '&#211;': 'Ó', '&Oacute;': 'Ó',
  '&#243;': 'ó', '&oacute;': 'ó',
  '&#212;': 'Ô', '&Ocirc;': 'Ô',
  '&#244;': 'ô', '&ocirc;': 'ô',
  '&#213;': 'Õ', '&Otilde;': 'Õ',
  '&#245;': 'õ', '&otilde;': 'õ',
  '&#218;': 'Ú', '&Uacute;': 'Ú',
  '&#250;': 'ú', '&uacute;': 'ú',
  '&#199;': 'Ç', '&Ccedil;': 'Ç',
  '&#231;': 'ç', '&ccedil;': 'ç',
  '&ordm;': 'º', '&#186;': 'º',
  '&ordf;': 'ª', '&#170;': 'ª',
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  let res = str;
  for (const [entity, replacement] of Object.entries(ENTITY_MAP)) {
    res = res.replaceAll(entity, replacement);
  }
  // Suporte a entidades numéricas hex e decimais genéricas
  res = res.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
  res = res.replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
  return res.replace(/\s+/g, ' ').trim();
}

/**
 * Decodifica o código de horário padrão UnB (ex: "24M34 6T12") em slots estruturados.
 */
export function parseScheduleCode(scheduleStr: string): ScheduleSlot[] {
  const slots: ScheduleSlot[] = [];
  const regex = /(\d+)([MTN])(\d+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(scheduleStr)) !== null) {
    const daysPart = match[1] || '';
    const shiftChar = (match[2] || 'M') as 'M' | 'T' | 'N';
    const periodsPart = match[3] || '';

    for (const dayCh of daysPart) {
      const day = parseInt(dayCh, 10);
      if (isNaN(day)) continue;

      const dayName =
        day === 2 ? 'Seg' :
        day === 3 ? 'Ter' :
        day === 4 ? 'Qua' :
        day === 5 ? 'Qui' :
        day === 6 ? 'Sex' :
        day === 7 ? 'Sáb' : 'Outro';

      for (const periodCh of periodsPart) {
        const period = parseInt(periodCh, 10);
        if (isNaN(period)) continue;

        let timeRange = '';
        let shiftOffset = 0;

        switch (shiftChar) {
          case 'M':
            shiftOffset = period - 1;
            timeRange =
              period === 1 ? '08:00 - 08:55' :
              period === 2 ? '08:55 - 09:50' :
              period === 3 ? '10:00 - 10:55' :
              period === 4 ? '10:55 - 11:50' :
              period === 5 ? '12:00 - 12:55' : 'Horário Manhã';
            break;
          case 'T':
            shiftOffset = 5 + (period - 1);
            timeRange =
              period === 1 ? '12:55 - 13:50' :
              period === 2 ? '14:00 - 14:55' :
              period === 3 ? '14:55 - 15:50' :
              period === 4 ? '16:00 - 16:55' :
              period === 5 ? '16:55 - 17:50' :
              period === 6 ? '18:00 - 18:55' : 'Horário Tarde';
            break;
          case 'N':
            shiftOffset = 11 + (period - 1);
            timeRange =
              period === 1 ? '19:00 - 19:50' :
              period === 2 ? '19:50 - 20:40' :
              period === 3 ? '20:50 - 21:40' :
              period === 4 ? '21:40 - 22:30' : 'Horário Noite';
            break;
        }

        const slot: ScheduleSlot = {
          day,
          day_name: dayName,
          shift: shiftChar,
          period,
          time_range: timeRange,
          global_slot_index: shiftOffset,
        };

        const exists = slots.some(
          (s) =>
            s.day === slot.day &&
            s.shift === slot.shift &&
            s.period === slot.period
        );
        if (!exists) {
          slots.push(slot);
        }
      }
    }
  }

  return slots;
}

/**
 * Decompõe o campo bruto de horário do SIGAA em código(s), período de datas e descrição humana legível.
 */
export function parseScheduleField(raw: string): {
  schedule_code: string;
  date_range?: string;
  schedule_description?: string;
} {
  const decoded = decodeHtmlEntities(raw);
  const trimmed = decoded.trim();
  if (!trimmed) {
    return { schedule_code: 'A definir' };
  }

  // 1. Extrair intervalo de datas: (dd/mm/aaaa - dd/mm/aaaa)
  const dateRegex = /\(([\d/]{8,10}\s*(?:-|a|à)\s*[\d/]{8,10})\)/;
  const dateMatch = dateRegex.exec(trimmed);
  const dateRange = dateMatch ? dateMatch[1].trim() : undefined;
  const withoutDates = trimmed.replace(dateRegex, ' ');

  // 2. Extrair código(s) de horário padrão UnB (ex: "24T45", "6T12")
  const codeRegex = /\b(\d+[MTN]\d+)\b/g;
  const codes: string[] = [];
  let cm: RegExpExecArray | null;
  while ((cm = codeRegex.exec(withoutDates)) !== null) {
    codes.push(cm[1]);
  }

  const scheduleCode = codes.length > 0 ? codes.join(' ') : (withoutDates.split(/\s+/)[0] || 'A definir');

  // 3. Extrair texto restante para descrição humana
  let withoutCodes = withoutDates.replace(codeRegex, ' ');
  const dayRegex = /([^/\s])\s*(Segunda(?:-feira)?|Terça(?:-feira)?|Terca(?:-feira)?|Quarta(?:-feira)?|Quinta(?:-feira)?|Sexta(?:-feira)?|Sábado|Sabado|Domingo)/gi;
  withoutCodes = withoutCodes.replace(dayRegex, '$1 / $2');

  const cleanedDesc = withoutCodes
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[/,\s() -]+|[/,\s() -]+$/g, '');

  const scheduleDesc =
    cleanedDesc && cleanedDesc !== scheduleCode ? cleanedDesc : undefined;

  return {
    schedule_code: scheduleCode,
    date_range: dateRange,
    schedule_description: scheduleDesc,
  };
}

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 4,
  delayMs = 2000
): Promise<Response> {
  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    try {
      const signal = options.signal || AbortSignal.timeout(30000);
      const res = await fetch(url, { ...options, signal });
      if (res.ok || res.status === 404) return res;
      if (attempt === maxRetries) return res;
    } catch (e) {
      if (attempt === maxRetries) throw e;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
  }
  throw new Error(`Falha após ${maxRetries} tentativas para ${url}`);
}
