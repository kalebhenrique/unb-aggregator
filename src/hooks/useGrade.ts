import { useState, useEffect, useCallback, useMemo } from 'react';
import { useContainer } from '../context/ContainerContext';
import type {
  Department,
  ScrapedDiscipline,
  ScrapedClass,
  ScheduleOption,
  SavedGrade,
} from '@/core';

// Cache em memória de disciplinas por depto-ano-período
const disciplinesCache = new Map<string, ScrapedDiscipline[]>();

// Cache da última grade salva para restauração instantânea ao revisitar a tela
let savedGradeCache: SavedGrade | null = null;

// Busca sem sensibilidade a acentos, maiúsculas ou pontuação ("calculo" acha "Cálculo")
const normalizeText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function useGrade() {
  const container = useContainer();

  const [departments, setDepartments] = useState<Department[]>([]);

  // Carrega seleção prévia do localStorage para manter filtros entre abas
  const [selectedDeptId, setSelectedDeptIdState] = useState<string>(() => {
    try {
      return localStorage.getItem('unb_grade_deptId') || '508';
    } catch {
      return '508';
    }
  });

  const [year, setYearState] = useState<string>(() => {
    try {
      return localStorage.getItem('unb_grade_year') || '2026';
    } catch {
      return '2026';
    }
  });

  const [period, setPeriodState] = useState<string>(() => {
    try {
      return localStorage.getItem('unb_grade_period') || '2';
    } catch {
      return '2';
    }
  });

  const setSelectedDeptId = useCallback((id: string) => {
    setSelectedDeptIdState(id);
    try {
      localStorage.setItem('unb_grade_deptId', id);
    } catch {}
  }, []);

  const setYear = useCallback((y: string) => {
    setYearState(y);
    try {
      localStorage.setItem('unb_grade_year', y);
    } catch {}
  }, []);

  const setPeriod = useCallback((p: string) => {
    setPeriodState(p);
    try {
      localStorage.setItem('unb_grade_period', p);
    } catch {}
  }, []);

  // Inicializa disciplinas a partir do cache se já disponíveis
  const [disciplines, setDisciplines] = useState<ScrapedDiscipline[]>(() => {
    const initialKey = `${selectedDeptId}-${year}-${period}`;
    return disciplinesCache.get(initialKey) || [];
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Restaura instantaneamente da visita anterior da sessão (evita flash de empty state)
  const [selectedClasses, setSelectedClasses] = useState<ScrapedClass[]>(
    () => savedGradeCache?.selectedClasses ?? [],
  );
  const [conflicts, setConflicts] = useState<string[]>([]);

  const [scheduleOptions, setScheduleOptions] = useState<ScheduleOption[]>([]);
  const [currentOptionIndex, setCurrentOptionIndex] = useState<number>(0);

  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Carrega departamentos e grade salva no início
  useEffect(() => {
    let isMounted = true;

    async function init() {
      console.log('[useGrade] Inicializando tela de montar grade...');
      try {
        const depts = await container.useCases.getDepartments.execute();
        console.log('[useGrade] Departamentos carregados:', depts?.length);
        if (isMounted) {
          setDepartments(depts);
        }

        // Tenta carregar grade salva do SQLite (inclusive grade vazia salva de propósito)
        const saved = await container.useCases.manageGrade.get();
        console.log('[useGrade] Grade salva recuperada do SQLite:', saved);
        savedGradeCache = saved;
        if (isMounted && saved) {
          setSelectedClasses(saved.selectedClasses ?? []);
        }
      } catch (e) {
        console.warn('[useGrade] Erro ao inicializar grade:', e);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [container]);

  // Coleta turmas do departamento selecionado com suporte a cache
  const fetchClasses = useCallback(
    async (deptId = selectedDeptId, y = year, p = period, force = false) => {
      const key = `${deptId}-${y}-${p}`;

      // Se temos em cache e não foi forçado recarregamento, usa cache imediatamente
      if (!force && disciplinesCache.has(key)) {
        const cached = disciplinesCache.get(key)!;
        setDisciplines(cached);
        setFeedbackMessage(`Exibindo ${cached.length} disciplinas carregadas.`);
        return;
      }

      console.log(`[useGrade] fetchClasses: iniciando coleta para depto=${deptId}, ano=${y}, período=${p}`);
      setIsScraping(true);
      setFeedbackMessage(null);
      try {
        const result = await container.useCases.scrapeClasses.execute(deptId, y, p);
        console.log(`[useGrade] fetchClasses: sucesso com ${result.length} disciplinas recebidas`);
        disciplinesCache.set(key, result);
        setDisciplines(result);
        setFeedbackMessage(`Coleta realizada: ${result.length} disciplinas disponíveis.`);
      } catch (err) {
        console.error('[useGrade] fetchClasses: erro capturado:', err);
        setFeedbackMessage(`Aviso: ${errMsg(err)}`);
      } finally {
        setIsScraping(false);
      }
    },
    [container, selectedDeptId, year, period]
  );

  // Restaura disciplinas do cache se já disponíveis ao alterar os seletores
  useEffect(() => {
    const key = `${selectedDeptId}-${year}-${period}`;
    if (disciplinesCache.has(key)) {
      setDisciplines(disciplinesCache.get(key)!);
      setFeedbackMessage(null);
    }
  }, [selectedDeptId, year, period]);

  // Carrega turmas apenas na primeira visita se o cache ainda estiver vazio
  useEffect(() => {
    const key = `${selectedDeptId}-${year}-${period}`;
    if (!disciplinesCache.has(key) && disciplines.length === 0) {
      fetchClasses(selectedDeptId, year, period, false);
    }
  }, [selectedDeptId, year, period, disciplines.length, fetchClasses]);

  // Recalcula conflitos sempre que as turmas selecionadas mudarem
  useEffect(() => {
    let isMounted = true;

    async function checkCurrentConflicts() {
      if (selectedClasses.length < 2) {
        if (isMounted) setConflicts([]);
        return;
      }

      try {
        const found = await container.useCases.solveSchedule.checkConflicts(selectedClasses);
        if (isMounted) setConflicts(found);
      } catch {
        if (isMounted) setConflicts([]);
      }
    }

    checkCurrentConflicts();

    return () => {
      isMounted = false;
    };
  }, [selectedClasses, container]);

  // Filtro de disciplinas por busca
  const filteredDisciplines = useMemo(() => {
    if (!searchQuery.trim()) return disciplines;
    const q = normalizeText(searchQuery);
    return disciplines.filter(
      (d) => normalizeText(d.code).includes(q) || normalizeText(d.name).includes(q)
    );
  }, [disciplines, searchQuery]);

  // Adiciona ou remove turma
  const toggleClass = useCallback((cls: ScrapedClass) => {
    setSelectedClasses((prev) => {
      const exists = prev.some((c) => c.id === cls.id);
      if (exists) {
        return prev.filter((c) => c.id !== cls.id);
      } else {
        // Se já existe turma da mesma disciplina, substitui por esta turma escolhida
        const filtered = prev.filter((c) => c.disciplineCode !== cls.disciplineCode);
        return [...filtered, cls];
      }
    });
  }, []);

  const removeClass = useCallback((classId: string) => {
    setSelectedClasses((prev) => prev.filter((c) => c.id !== classId));
  }, []);

  const clearGrade = useCallback(() => {
    setSelectedClasses([]);
    setConflicts([]);
    setScheduleOptions([]);
    setCurrentOptionIndex(0);
    setFeedbackMessage(null);
  }, []);

  // Gerador automático de combinações sem conflito
  const generateCombinations = useCallback(
    async (preferenceShift?: 'M' | 'T' | 'N') => {
      if (selectedClasses.length === 0) {
        setFeedbackMessage('Selecione ao menos uma disciplina para gerar combinações.');
        return;
      }

      setIsSolving(true);
      setFeedbackMessage(null);

      try {
        // Pega todas as turmas disponíveis para as disciplinas atualmente selecionadas
        const targetDisciplineCodes = new Set(selectedClasses.map((c) => c.disciplineCode));
        const candidateClasses: ScrapedClass[] = [];

        for (const disc of disciplines) {
          if (targetDisciplineCodes.has(disc.code)) {
            candidateClasses.push(...disc.classes);
          }
        }

        // Se nenhuma turma foi encontrada no catálogo local, usa as próprias turmas selecionadas
        const pool = candidateClasses.length > 0 ? candidateClasses : selectedClasses;
        const options = await container.useCases.solveSchedule.execute(pool, preferenceShift);

        setScheduleOptions(options);
        setCurrentOptionIndex(0);

        if (options.length > 0) {
          setSelectedClasses(options[0].classes);
          setFeedbackMessage(
            `Geradas ${options.length} opções sem conflito! Exibindo opção 1.`
          );
        } else {
          setFeedbackMessage('Nenhuma combinação sem conflito foi encontrada para essas disciplinas.');
        }
      } catch (err) {
        setFeedbackMessage(`Erro ao gerar grade: ${errMsg(err)}`);
      } finally {
        setIsSolving(false);
      }
    },
    [container, selectedClasses, disciplines]
  );

  const applyOption = useCallback(
    (index: number) => {
      if (index >= 0 && index < scheduleOptions.length) {
        setCurrentOptionIndex(index);
        setSelectedClasses(scheduleOptions[index].classes);
      }
    },
    [scheduleOptions]
  );

  // Salvar no SQLite (grade vazia também é salvable: persiste o estado "sem grade")
  const saveGrade = useCallback(async () => {
    setIsSaving(true);
    try {
      const grade: SavedGrade = {
        id: `grade-${year}-${period}`,
        name: `Grade ${year}.${period}`,
        semester: `${year}.${period}`,
        selectedClasses,
        updatedAt: new Date().toISOString(),
      };

      await container.useCases.manageGrade.save(grade);
      savedGradeCache = grade;
      setFeedbackMessage('Grade salva com sucesso no seu computador!');
    } catch (err) {
      setFeedbackMessage(`Erro ao salvar grade: ${errMsg(err)}`);
    } finally {
      setIsSaving(false);
    }
  }, [container, selectedClasses, year, period]);

  return {
    departments,
    selectedDeptId,
    setSelectedDeptId,
    year,
    setYear,
    period,
    setPeriod,
    disciplines,
    filteredDisciplines,
    searchQuery,
    setSearchQuery,
    selectedClasses,
    conflicts,
    scheduleOptions,
    currentOptionIndex,
    isScraping,
    isSolving,
    isSaving,
    feedbackMessage,
    fetchClasses,
    toggleClass,
    removeClass,
    clearGrade,
    generateCombinations,
    applyOption,
    saveGrade,
  };
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
