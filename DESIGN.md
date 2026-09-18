# Design System

This document defines the visual design system for Detecto. All components and pages must follow these conventions.

The system is a **light "vision sheet"** identity: a cool pale-blue graph-paper field, Space Grotesk for the voice, IBM Plex Mono for figures, and a single phosphor-green accent that matches the detection boxes the backend draws (`(0,255,0)`), with amber reserved for zones (`(255,165,0)`). It deliberately avoids default SaaS patterns: no shadowed card rows, no all-caps eyebrows, no emoji icons, no gradient washes.

---

## Stack

- **Framework:** Vite + React 19 (JSX)
- **Styling:** Tailwind CSS v4. Design tokens live in the `@theme` block of `index.css`; component recipes (`.sheet`, `.btn-*`, `.monitor`, `.field`, `.pill-signal`, `.badge-mock`, `.scanline`, `.rec-dot`) live in `@layer components`.
- **Fonts:** two web fonts via Google Fonts `<link>` in `index.html`:
  - `Space Grotesk` (400–700) → `--font-sans` (everything UI)
  - `IBM Plex Mono` (400, 500) → `--font-mono` (numeric readouts, timestamps, filenames)
- **Icons:** no icon library and no emoji. The only graphic is the `Mark` detection-target emblem (`components/Mark.jsx`) and the SVG favicon based on the same mark.
- **Dark mode:** none — light theme only.

---

## Colors

Defined as Tailwind v4 `@theme` tokens. Use the semantic utilities (`bg-paper`, `text-ink`, `border-line`, `bg-vision`, …), never raw hex.

| Token | Hex | Usage |
|---|---|---|
| `paper` | `#eef2f7` | Page background (cool pale blue, ~ice blueprint) |
| `surface` | `#ffffff` | Sheets, panels, inputs |
| `ink` | `#15233b` | Primary text, active nav, primary-on ink buttons, tab active |
| `ink-soft` | `#55667f` | Secondary text, labels |
| `ink-faint` | `#8a99af` | Chart hour labels, dim readouts |
| `line` | `#d9e1ec` | Hairline borders, dividers |
| `line-strong` | `#bfccdd` | Input borders, chart baseline |
| `vision` | `#0e9f62` | THE accent — matches YOLO boxes: monitor brackets, bars, dots, links |
| `vision-strong` | `#0b7a48` | Primary buttons (white text) |
| `vision-deep` | `#085f38` | Primary button hover, bar hover |
| `vision-tint` | `#e2f4ea` | Pale green fills (status notes) |
| `signal` | `#b45309` | Amber alert text — matches zone rect `(255,165,0)` |
| `signal-tint` | `#fdf3e1` | Amber alert/badge fills |
| `alert` | `#dc2626` | Errors, destructive actions |
| `alert-tint` | `#fdecec` | Error panel fills |

## Typography

- Base: `Space Grotesk` via `--font-sans`. Headings `font-semibold tracking-tight`, sentence case, no all-caps eyebrows.
- Figures: `IBM Plex Mono` (`--font-mono`), `font-medium tabular-nums` for stat readouts, timestamps, file names, chart labels.
- Labels are always Grotesk with lowercase sentence case (`text-xs text-ink-soft`). Mono is reserved for actual data, never decorative micro-labels.

---

## Surfaces & Layout

- Content wrapper: `mx-auto max-w-5xl px-6 py-10` on both pages. Everything left-aligned.
- Page header: `h1` `text-3xl font-semibold tracking-tight` + one `text-sm text-ink-soft` subtitle line (+ `badge-mock` on the right when `useMock`).
- Sheet = the only panel primitive: `border border-line rounded-[10px] bg-surface`.
- Readout strip = one sheet, `grid grid-cols-3 divide-x divide-line` (4 cols on History), cells `px-6 py-4`, each holding a `StatsCard`. No individual cards, no shadows.
- Background: `body` paints `--color-paper` plus a faint 28px ruled grid (`linear-gradient` hairlines at 3% ink).

## Components (recipe classes in `index.css`)

- `.sheet` — base panel.
- `.btn` / `.btn-primary` (green, white text) / `.btn-ink` (dark) / `.btn-outline` (hairline) / `.btn-danger` (red outline, fills red on hover) — all `rounded-[8px]`, `:disabled` at 50% opacity.
- `.field` — number/text inputs: hairline border, focused = `border-vision` + 2px green ring.
- `.monitor` — the hero: a sheet wrapped by two green corner brackets (top-left / bottom-right, via `::before/::after`). Used on the Photo tab and the Live feed.
- `.scanline` — a green sweep across the monitor while an image is being scanned.
- `.rec-dot` — pulsing red dot shown with the `REC` readout while the live camera streams.
- `.pill-signal` — amber pill (Clear zone / zone controls).
- `.badge-mock` — dashed amber pill, mono "mock mode".
- `.navlink` is formed inline in `Navbar.jsx`: bottom border `border-vision` when active, transparent otherwise.

All motion (`.scanline`, `.rec-dot`) is disabled under `prefers-reduced-motion`.

---

## Components

### Navbar (`components/Navbar.jsx`)

```
sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur
```
- Left: `Mark` (h-5 w-5) + "Detecto" (`text-lg font-semibold tracking-tight`).
- Right: `NavLink`s labelled **Detect** and **History**, `border-b-2` underline in `vision` when active.

### Mark (`components/Mark.jsx`)

Detection-target emblem: rounded green box + faint crosshair + green center dot. Used in `Navbar` and as the empty-state graphic. The `favicon.svg` is the same mark.

### StatsCard (`components/StatsCard.jsx`)

Props: `label`, `value` (no icon).
```
flex min-w-28 flex-col gap-1
  label: text-xs text-ink-soft
  value: font-mono text-2xl font-medium tabular-nums text-ink
```
Always used as a cell inside a readout strip sheet.

### Segmented tabs (Detection View)

```
inline-flex rounded-lg border border-line bg-surface p-0.5
```
- Active: `bg-ink text-surface` · Inactive: `text-ink-soft hover:text-ink`, `rounded-md px-4 py-2 text-sm`.

---

## Pages

### Detect (`/`)

1. Header: "Detect people" + subtitle "Upload a photo or start the live camera. Every person found is counted and logged to history." (+ mock badge)
2. Segmented tabs **Photo** / **Live**.
3. **Photo tab** — a `.monitor` (brackets + sheet):
   - Empty: centered `Mark`, "No image to scan yet", "Pick a JPEG or PNG and run detection on it.", green **Choose a photo** button (opens the hidden file input).
   - Selected, unscanned: raw preview in the sheet, then a hairline footer with the filename (`font-mono text-xs`) + **Detect people** (green) and **Change** (outline).
   - Scanning: `.scanline` sweeps the monitor; button reads "Scanning…".
   - Result: annotated image in the sheet, footer note in the interface voice — `<green dot> N people detected and logged` (or "No people found in this photo."). Below the monitor: a 3-cell readout strip (People found / Average confidence / Inference time) and an outline **Scan another photo**.
4. **Live tab** — `<LiveView />`.

### Live (`components/LiveView.jsx`)

- Controls: **Start camera** (`btn-primary` green) / **Stop feed** (`btn-ink`). While streaming a `REC 640×480` readout with pulsing `.rec-dot`. "detecting…" (mono) during frame uploads.
- **Alert threshold** number input (`.field`), amber **Clear zone** pill when a zone is set.
- Feed in a `.monitor`: video + annotated image overlay + 640×480 zone-drawing `<canvas>` (zone stroke `#d97706`). Waiting state: "waiting for first frame…" mono pill.
- Under the feed: readout strip (People in frame / Avg confidence / Inference) and, when a zone exists, a second strip (Inside zone / Tracked IDs).
- **Zone alert**: amber panel (`border-signal/40 bg-signal-tint`), "!" roundel, "N people inside the restricted zone" + `threshold N` mono on the right. Errors render as `role="alert"` red panels (`border-alert/30 bg-alert-tint`), no apologies.

### History (`/history`)

1. Header: "History" + "Every detection the camera has logged." (+ mock badge)
2. 4-cell readout strip (Total detections / Total people / Avg confidence / Last hour) when stats load.
3. **Bar chart** sheet: title "People detected per hour" right-aligned busiest readout `{time} ({n} people)`; green bars on a hairline baseline (`border-b border-line-strong`), `bg-vision group-hover:bg-vision-deep`; mono hour labels underneath.
4. Filters: **Minimum confidence** `.field`; actions **Download CSV** (`btn-outline`) and **Reset log** (`btn-danger`).
5. **Data log** table: only hairlines (`border-t border-line`), header row `border-b bg-paper/70` with sentence-case labels; timestamps and all figures in mono `tabular-nums`; numbers right-aligned; rows `hover:bg-paper/50`.
6. Empty log = an invitation: centered `Mark`, "No detections recorded yet", "Run a detection on the Detect page and it will show up here."

---

## Responsive

- History stat strip: `grid-cols-2 sm:grid-cols-4`.
- Everything else is single-column; `flex-wrap` handles the control rows; monitor images use `max-h-[60-62vh] object-contain`.

---

## Branding

- App name: **Detecto** — `Mark + "Detecto"` in the navbar; API title "Detecto API" in `backend/main.py`.
- Clear viewport title: "Detecto — Person detection & counting" in `index.html`.
- `favicon.svg` (public) is the detection-target mark in green.

---

## Open items

- The `zoneFromEvent` scaling in `LiveView.jsx` multiplies by 640 for both axes (existing behavior) — revisit if zone drawing drifts on non-640px displays.