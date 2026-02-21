import { createMemo, createSignal, For, Show } from 'solid-js';

type Props = {
  value?: string;     // YYYY-MM-DD
  min?: string;       // YYYY-MM-DD
  max?: string;       // YYYY-MM-DD
  onSelect: (date: string) => void;
};

type View = 'days' | 'months' | 'years';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const YEARS_PER_PAGE = 12;

const pad = (n: number) => String(n).padStart(2, '0');

const toYMD = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;

const parseYMD = (s: string): [number, number, number] | null => {
  if (!s) return null;
  const parts = s.split('-');
  if (parts.length !== 3) return null;
  return [parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])];
};

const DateCalendar = (props: Props) => {
  const today = new Date();
  const todayStr = toYMD(today.getFullYear(), today.getMonth(), today.getDate());

  const initialParsed = () => {
    const p = parseYMD(props.value ?? '');
    if (p) return { year: p[0], month: p[1] };
    return { year: today.getFullYear(), month: today.getMonth() };
  };

  const [viewYear, setViewYear] = createSignal(initialParsed().year);
  const [viewMonth, setViewMonth] = createSignal(initialParsed().month);
  const [view, setView] = createSignal<View>('days');

  // Year range: the page of YEARS_PER_PAGE years containing viewYear
  const yearPageStart = createMemo(() =>
    Math.floor(viewYear() / YEARS_PER_PAGE) * YEARS_PER_PAGE
  );
  const yearPage = createMemo(() =>
    Array.from({ length: YEARS_PER_PAGE }, (_, i) => yearPageStart() + i)
  );

  // ── Day view helpers ──────────────────────────────────────────────────────

  const daysInMonth = createMemo(() =>
    new Date(viewYear(), viewMonth() + 1, 0).getDate()
  );

  const firstDayOfWeek = createMemo(() =>
    new Date(viewYear(), viewMonth(), 1).getDay()
  );

  const cells = createMemo(() => {
    const blanks = Array(firstDayOfWeek()).fill(null);
    const days = Array.from({ length: daysInMonth() }, (_, i) => i + 1);
    return [...blanks, ...days];
  });

  const prevMonth = () => {
    if (viewMonth() === 0) { setViewMonth(11); setViewYear(v => v - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth() === 11) { setViewMonth(0); setViewYear(v => v + 1); }
    else setViewMonth(m => m + 1);
  };

  const isDisabled = (day: number) => {
    const d = toYMD(viewYear(), viewMonth(), day);
    if (props.min && d < props.min) return true;
    if (props.max && d > props.max) return true;
    return false;
  };

  const isSelected = (day: number) =>
    toYMD(viewYear(), viewMonth(), day) === (props.value ?? '');

  const isToday = (day: number) =>
    toYMD(viewYear(), viewMonth(), day) === todayStr;

  const handleSelect = (day: number) => {
    if (isDisabled(day)) return;
    props.onSelect(toYMD(viewYear(), viewMonth(), day));
  };

  // ── Month view helpers ────────────────────────────────────────────────────

  const isMonthDisabled = (m: number) => {
    // Disabled if the entire month is outside min/max range
    const lastDay = new Date(viewYear(), m + 1, 0).getDate();
    const firstStr = toYMD(viewYear(), m, 1);
    const lastStr = toYMD(viewYear(), m, lastDay);
    if (props.max && firstStr > props.max) return true;
    if (props.min && lastStr < props.min) return true;
    return false;
  };

  const isSelectedMonth = (m: number) => {
    const p = parseYMD(props.value ?? '');
    return p ? p[0] === viewYear() && p[1] === m : false;
  };

  const selectMonth = (m: number) => {
    if (isMonthDisabled(m)) return;
    setViewMonth(m);
    setView('days');
  };

  // ── Year view helpers ─────────────────────────────────────────────────────

  const isYearDisabled = (y: number) => {
    const firstStr = `${y}-01-01`;
    const lastStr = `${y}-12-31`;
    if (props.max && firstStr > props.max) return true;
    if (props.min && lastStr < props.min) return true;
    return false;
  };

  const isSelectedYear = (y: number) => {
    const p = parseYMD(props.value ?? '');
    return p ? p[0] === y : false;
  };

  const selectYear = (y: number) => {
    if (isYearDisabled(y)) return;
    setViewYear(y);
    setView('months');
  };

  // ── Header label / navigation ─────────────────────────────────────────────

  const headerLabel = () => {
    if (view() === 'days') return `${MONTHS[viewMonth()]} ${viewYear()}`;
    if (view() === 'months') return `${viewYear()}`;
    return `${yearPageStart()} – ${yearPageStart() + YEARS_PER_PAGE - 1}`;
  };

  const handleHeaderClick = () => {
    if (view() === 'days') setView('months');
    else if (view() === 'months') setView('years');
    else setView('days');
  };

  const handlePrev = () => {
    if (view() === 'days') prevMonth();
    else if (view() === 'months') setViewYear(v => v - 1);
    else setViewYear(v => v - YEARS_PER_PAGE);
  };

  const handleNext = () => {
    if (view() === 'days') nextMonth();
    else if (view() === 'months') setViewYear(v => v + 1);
    else setViewYear(v => v + YEARS_PER_PAGE);
  };

  return (
    <div class="absolute z-50 mt-1 w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/60 dark:shadow-black/30 overflow-hidden select-none">

      {/* Header */}
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <button
          type="button"
          onClick={handlePrev}
          class="h-7 w-7 flex items-center justify-center rounded-full text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleHeaderClick}
          class="flex items-center gap-1 text-sm font-semibold text-gray-700 dark:text-gray-200 tracking-wide hover:text-pink-500 dark:hover:text-pink-400 transition-colors rounded px-2 py-0.5"
        >
          {headerLabel()}
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <Show when={view() === 'days'} fallback={
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
            }>
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </Show>
          </svg>
        </button>

        <button
          type="button"
          onClick={handleNext}
          class="h-7 w-7 flex items-center justify-center rounded-full text-gray-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day view */}
      <Show when={view() === 'days'}>
        <div class="grid grid-cols-7 px-3 pt-2">
          <For each={WEEKDAYS}>
            {(d) => (
              <div class="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
                {d}
              </div>
            )}
          </For>
        </div>

        <div class="grid grid-cols-7 gap-y-0.5 px-3 pb-3">
          <For each={cells()}>
            {(day) => (
              <Show when={day !== null} fallback={<div />}>
                <button
                  type="button"
                  onClick={() => handleSelect(day as number)}
                  disabled={isDisabled(day as number)}
                  class={[
                    'h-8 w-8 mx-auto flex items-center justify-center rounded-full text-xs transition-all',
                    isSelected(day as number)
                      ? 'bg-pink-500 text-white font-semibold shadow-sm'
                      : isToday(day as number)
                      ? 'ring-2 ring-pink-400 text-pink-600 dark:text-pink-400 font-semibold'
                      : isDisabled(day as number)
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500',
                  ].join(' ')}
                >
                  {day}
                </button>
              </Show>
            )}
          </For>
        </div>
      </Show>

      {/* Month view */}
      <Show when={view() === 'months'}>
        <div class="grid grid-cols-3 gap-2 p-3">
          <For each={MONTHS_SHORT}>
            {(name, i) => (
              <button
                type="button"
                onClick={() => selectMonth(i())}
                disabled={isMonthDisabled(i())}
                class={[
                  'py-2 rounded-lg text-sm font-medium transition-all',
                  isSelectedMonth(i())
                    ? 'bg-pink-500 text-white shadow-sm'
                    : isMonthDisabled(i())
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : i() === today.getMonth() && viewYear() === today.getFullYear()
                    ? 'ring-2 ring-pink-400 text-pink-600 dark:text-pink-400'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500',
                ].join(' ')}
              >
                {name}
              </button>
            )}
          </For>
        </div>
      </Show>

      {/* Year view */}
      <Show when={view() === 'years'}>
        <div class="grid grid-cols-3 gap-2 p-3">
          <For each={yearPage()}>
            {(year) => (
              <button
                type="button"
                onClick={() => selectYear(year)}
                disabled={isYearDisabled(year)}
                class={[
                  'py-2 rounded-lg text-sm font-medium transition-all',
                  isSelectedYear(year)
                    ? 'bg-pink-500 text-white shadow-sm'
                    : isYearDisabled(year)
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : year === today.getFullYear()
                    ? 'ring-2 ring-pink-400 text-pink-600 dark:text-pink-400'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500',
                ].join(' ')}
              >
                {year}
              </button>
            )}
          </For>
        </div>
      </Show>

    </div>
  );
};

export default DateCalendar;
