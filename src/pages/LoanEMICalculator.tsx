I have a large React file named LoanEMICalculator_Full.tsx.
I want you to rewrite it from scratch with the same UI and main functionality, but with a lightweight, ultra-fast approach.

Here’s what I need:

Load time under 1 second on normal hosting (no heavy dependencies).

Keep all current calculator logic (EMI, prepayment, comparison, schedule, charts).

Remove unnecessary re-renders — use useMemo, useDeferredValue, and dynamic imports for heavy parts like charts.

Lazy-load charts and schedule only when toggled ON (with a small skeleton loader).

Minimize imports — no redundant components or utilities.

Split into small sub-components (BasicInputs, AdvancedControls, ChartsSection, ScheduleTable) with React.memo.

Replace alert() and big DOM updates with non-blocking toast messages.

Preload essential code only (basic calculator + results).

Auto-detect currency by locale but keep manual select option.

Instant response on typing — use debounced recalculation (no lag).

Bundle size < 200KB total.

No external chart lib unless absolutely needed — use a minimal SVG or dynamically import Recharts.

Keep the design and color theme the same (dark with cyan highlights).

Finally, give me a single downloadable .tsx file (ready to drop in /pages) —
optimized for speed, performance, and minimal load time.