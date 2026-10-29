# Sales Analytics & Regional Variance Explorer

An executive sales performance dashboard for uploading sales order CSVs, visualizing multi-line quarterly revenue trends across regions, inspecting tabular pivot metrics, and generating a strictly grounded 3-sentence AI analysis of Q2-to-Q3 shifts.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions incorporate your confirmed preferences from Phase 1:
> - **Zero Default Dataset**: The dashboard starts clean in an intuitive empty state with an upload dropzone, file format guidance, and column validation.
> - **Visualization Style**: Multi-line quarterly trend chart depicting quarter progression (Q1 -> Q4) with distinct region lines, interactive hover tooltips, and line toggles.
> - **AI Analysis Guardrails**: Strict analytical boundary limiting the AI prompt and summary to pre-computed regional revenue totals and calculated Q2-to-Q3 variance metrics (no outside hallucinated factors).

---

### 1. Overview & Core Concept

- **What It Does**: Enables revenue operations teams and analysts to upload sales order CSV files (containing `quarter`, `region`, `channel`, `product`, `units`, `discount_pct`, `revenue`), automatically validates and parses the data, aggregates revenue by region and quarter, renders a responsive multi-line trend chart and interactive pivot data table, and invokes Gemini 3.8 Flash via a secure server endpoint to produce a verifiable three-sentence executive summary of the greatest Q2-to-Q3 regional shift.
- **Target Audience**: Sales leaders, revenue analysts, and executives who need instant verification of quarterly momentum without manual spreadsheet formulas.
- **Key Value**: Guaranteed mathematical accuracy by computing all aggregations, deltas, and rankings deterministically on the client/server before providing the exact numbers to the AI.

---

### 2. User Experience & Visual Design

Following the **SaaS & Dashboards** design standard (`references/3_saas_dashboard.md`):

- **Workspace Layout & Top Bar**:
  - Clean top bar following the 3-zone contract:
    - *Zone 1 (Wordmark)*: `Vantage Sales Analytics` in `Plus Jakarta Sans` font.
    - *Zone 2 (Links / Sections)*: `Dashboard`, `Quarterly Trend`, `Regional Pivot`, `AI Executive Brief`.
    - *Zone 3 (Action)*: `Upload CSV` button trigger with active file indicator.
- **Zero State (Upload Zone)**:
  - Clean dashed dropzone supporting drag-and-drop or file browsing.
  - Column schema pill-free guide showing required fields: `quarter`, `region`, `channel`, `product`, `units`, `discount_pct`, `revenue`.
  - Downloadable/copyable CSV template snippet for quick user testing.
- **Visual Theme & Typography**:
  - *Color Palette*: Slate-900 neutral dark baseline with clean white canvas surfaces (`#0F172A`, `#F8FAFC`, `#FFFFFF`), muted slate borders (`#E2E8F0`), and high-contrast accessible chart line hues (Indigo `#4F46E5`, Emerald `#059669`, Amber `#D97706`, Rose `#E11D48`, Violet `#7C3AED`, Sky `#0284C7`).
  - *Typography*: `Plus Jakarta Sans` for clean titles, `Public Sans` for body text, and tabular numerals (`font-mono tabular-nums`) for currency figures, percentages, and variance deltas.
  - *Zero-Pill Restraint*: Quiet metadata separated with `·` and clean tabular rows ($38\text{px}$ row height) with right-aligned financials.
- **Key Views & Sections**:
  1. **Upload & File Health Banner**: Active file name, row count, unique regions, and quarters detected, with a "Replace File" button.
  2. **Executive Summary Card (AI Analysis)**:
     - Prominent callout containing the generated 3-sentence analysis.
     - "Run Analysis" / "Regenerate" button with smooth loading state.
     - Adjacent verification drawer displaying the exact deterministic calculated numbers used by the model (Q2 revenue, Q3 revenue, absolute dollar delta, percentage change, and rank).
  3. **Multi-Line Quarterly Trend Chart**:
     - SVG-based responsive multi-line visualization displaying Quarters (X-axis) vs. Total Revenue (Y-axis).
     - Individual color-coded lines per region with point markers, subtle grid lines, hover crosshairs, and value tooltips.
     - Interactive legend allowing toggling of individual region lines on and off.
  4. **Regional Revenue Pivot Table**:
     - Matrix grid: Rows = Regions; Columns = Quarters (Q1, Q2, Q3, Q4) + Total Revenue + Q2->Q3 Absolute Delta + Q2->Q3 % Change.
     - Sortable headers, sticky summary total row, and tabular formatting (`$X,XXX,XXX`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: SVG-based Multi-Line Chart Engine vs. Heavy Chart Library**
  - *Chosen Approach*: Self-contained, accessible, responsive React SVG multi-line chart with animated transitions, hover tooltips, and line toggling.
  - *Why*: Zero third-party dependency bloat, guaranteed compatibility with React 19, razor-sharp rendering, and customized styling matching the slate/indigo design tokens.
- **Decision 2: Strict Server-Side Gemini API Integration**
  - *Chosen Approach*: Express backend proxy endpoint (`POST /api/generate-summary`) with `@google/genai` using model `gemini-3.8-flash` and system instruction enforcing strict adherence to calculated numbers.
  - *Why*: Protects credentials, conforms to the `@google/genai` server-only skill guidelines, and allows structured system prompts with strict three-sentence constraints.
- **Decision 3: Robust Client-Side CSV Parser & Schema Sanitizer**
  - *Chosen Approach*: Resilient RFC-4180 CSV parser handling quoted values, trimmed headers, currency symbols (`$`, `,`), and percentage formats (`%`), with clear validation error messages if columns are missing.
  - *Why*: User CSVs frequently have slight header casing differences (`Quarter` vs `quarter`) or currency formats (`$12,500.00`). Flexible parsing prevents frustrating upload failures.

---

### 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                       Client UI                             │
│  ┌──────────────┐   ┌───────────────┐   ┌────────────────┐  │
│  │ CSV Dropzone │──>│ Parser & Data │──>│ Computed State │  │
│  └──────────────┘   │ Normalizer    │   │ Aggregations   │  │
│                     └───────────────┘   └────────┬───────┘  │
│                                                  │          │
│         ┌──────────────────┬─────────────────────┤          │
│         ▼                  ▼                     ▼          │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────┐  │
│  │ Multi-Line   │   │ Regional     │   │ Q2->Q3 Variance │  │
│  │ Trend Chart  │   │ Pivot Table  │   │ Calculator      │  │
│  └──────────────┘   └──────────────┘   └────────┬────────┘  │
└─────────────────────────────────────────────────┼───────────┘
                                                  │ POST /api/generate-summary
                                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                 Express Server (server.ts)                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Google GenAI SDK (gemini-3.8-flash)                    │ │
│  │ - Input: Exact JSON table of Q2, Q3, Deltas, & Max     │ │
│  │ - System prompt: Exactly 3 sentences using only numbers│ │
│  │ - Output: Clean 3-sentence summary                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

- **Calculated Variance Metrics**:
  $$\text{Delta} = \text{Revenue}_{Q3} - \text{Revenue}_{Q2}$$
  $$\%\Delta = \left( \frac{\text{Revenue}_{Q3} - \text{Revenue}_{Q2}}{\text{Revenue}_{Q2}} \right) \times 100$$
  $$\text{Max Changed Region} = \arg\max_{\text{region}} |\text{Delta}| \quad \text{and} \quad \arg\max_{\text{region}} |\% \Delta|$$
- **Gemini Prompt Injection Payload**:
  Sends a structured JSON payload containing the regional rankings, exact Q2 and Q3 amounts, dollar changes, and percentages, instructing the model to generate strictly three sentences without fabricating any external reasons.

---

### 5. Verification & Testing Plan

1. **Upload & CSV Parsing Test**:
   - Verify parsing with standard and quoted CSV rows containing headers `quarter`, `region`, `channel`, `product`, `units`, `discount_pct`, `revenue`.
   - Validate numerical scrubbing (e.g. `"$1,200.50"` -> `1200.5`).
2. **Aggregations & Calculations Test**:
   - Verify pivot totals match the sum of row items.
   - Verify Q2-to-Q3 variance calculations identify both the largest absolute dollar change and percentage change.
3. **Visualization & Interaction Test**:
   - Test line chart rendering with multiple quarters and regions.
   - Test line hover tooltips, line visibility toggling, and table sorting.
4. **AI Generation & Guardrails Test**:
   - Test `POST /api/generate-summary` with Gemini 3.8 Flash.
   - Verify the response is strictly 3 sentences and contains only verified numbers from the calculations.
5. **Compilation & Build**:
   - Run `compile_applet` and `lint_applet` to ensure error-free TypeScript compilation.
