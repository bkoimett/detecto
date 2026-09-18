# Design System

This document defines the visual design system for Detecto. All components and pages must follow these conventions.

The system is intentionally minimal: Tailwind CSS v4 default theme, light color scheme, emoji icons, and stock utility classes only. Do not introduce elaborate custom design systems (custom tokens, icon libraries, fonts, dark mode) without asking.

---

## Stack

- **Framework:** Vite + React 19 (JSX)
- **Styling:** Tailwind CSS v4 (default theme via `@import "tailwindcss"` in `index.css` — no `@theme` block, no CSS custom properties)
- **Icons:** emoji glyphs — no icon library
- **Fonts:** Tailwind default font stack — no web fonts
- **Dark mode:** none — light theme only

---

## Colors

All colors are Tailwind default palette utility classes applied inline in JSX. There are no design tokens.

| Class | Usage |
|---|---|
| `bg-gray-50` | Page background (`<main>`) |
| `bg-white` | Navbar, cards, table, stat cards |
| `bg-blue-600` | Primary buttons, active nav link, navbar brand text |
| `text-white` | Text on blue/red buttons, active nav link |
| `bg-red-600` / `hover:bg-red-700` | Destructive actions (Reset) |
| `text-red-600` | Error messages |
| `bg-gray-100` | Table header row |
| `text-gray-500` | Muted/secondary text, empty-state text |
| `text-gray-700` | Labels |
| `text-gray-900` | Headings, stat values |
| `hover:bg-gray-200` | Nav link hover state |
| `even:bg-gray-50` | Zebra striping on table rows |

---

## Typography

Default Tailwind typography classes only. No custom fonts or type scale.

| Class | Usage |
|---|---|
| `text-xl font-bold` | Navbar brand |
| `text-2xl font-bold` | Page headings (`h1`) |
| `text-lg font-bold` | Stat card values |
| `text-sm font-medium` | Nav links, min-confidence labels |
| `text-xs uppercase tracking-wide text-gray-500` | Stat card labels |
| `text-xs text-gray-500` | Secondary notes (selected-file hint) |

---

## Spacing & Layout

- Standard Tailwind spacing scale (`p-*`, `px-*`, `py-*`, `m-*`, `gap-*`).
- Content wrapper: `max-w-4xl mx-auto p-6` on both pages.
- Cards/stats row: `flex flex-wrap gap-4`.

---

## Border Radius

Default Tailwind radius utilities.

| Class | Usage |
|---|---|
| `rounded` | Nav links, input, table |
| `rounded-lg` | Buttons, stat cards, result image |
| `rounded-full` | (not currently used — reserved for pills/badges) |

---

## Shadows

- `shadow` — navbar, stat cards, result image, table.

---

## Components

### Navbar (`components/Navbar.jsx`)

```
bg-white shadow px-6 py-3 flex items-center gap-6
```
- Brand: `text-xl font-bold text-blue-600` + 🎯 emoji – "Detecto"
- Nav links use `NavLink` with a `linkClass` function:
  - Active: `bg-blue-600 text-white`
  - Inactive: `text-gray-600 hover:bg-gray-200`
  - Base: `px-4 py-2 rounded font-medium transition-colors`

### StatsCard (`components/StatsCard.jsx`)

Props: `label`, `value`, `icon`.

```
flex items-center gap-3 bg-white rounded-lg shadow px-4 py-3 min-w-40
```
- Icon: `text-2xl` emoji
- Label: `text-xs text-gray-500 uppercase tracking-wide`
- Value: `text-lg font-bold text-gray-900`

### Buttons

- Primary: `px-4 py-1.5 bg-blue-600 text-white rounded font-medium disabled:opacity-50 cursor-pointer`
- Destructive: `px-3 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-700 cursor-pointer`

### Forms / Inputs

- File input: plain `<input type="file">` with `text-sm`
- Number input (min confidence): `border rounded ml-2 px-2 py-1 w-20`

---

## Pages

### Detection View (`/`)

1. `h1` heading ("Detection View")
2. Upload row: file input + primary **Detect** button (label swaps to "Detecting..." while loading)
3. Selected-file hint, error message (`text-red-600`)
4. On result: row of `StatsCard` (People detected 👥, Avg confidence 🎯, Inference time ⏱) then annotated image
   - Image: `rounded shadow border max-w-full` with src `data:image/jpeg;base64,{result.annotated_image_b64}`

### History View (`/history`)

1. `h1` heading ("History")
2. Filter row: min-confidence number input + red **Reset** button
3. Table `w-full border bg-white rounded overflow-hidden` with `bg-gray-100` header and zebra rows, columns: Timestamp, People, Avg Conf, Inference (ms)
4. Empty state: centered `text-gray-500` "No detections recorded yet."

---

## Responsive

- Rely on Tailwind's default breakpoints when needed.
- Current breakpoints used: `flex-wrap` for the stats row. Layout is otherwise single-column and works at all widths with no adaptations.

---

## Icons

Emojis only. Currently in use:

| Emoji | Usage |
|---|---|
| 🎯 | Navbar brand, Avg confidence stat |
| 👥 | People detected stat |
| ⏱ | Inference time stat |

---

## Branding

- App name: **Detecto** — written as `🎯 Detecto` (`text-xl font-bold text-blue-600`) in the navbar and as the backend API title ("Detecto API" in `backend/main.py`).
- Browser title in `frontend/index.html` is still the Vite default `frontend` — update it if branding matters.