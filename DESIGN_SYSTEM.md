# Weekndrr Design System

The single reference for how Weekndrr looks and behaves. It documents what the app already ships. It is not a redesign.

- **Stack:** React 18, Tailwind CSS 3, shadcn/ui ("new-york" style, JS), Radix primitives, `class-variance-authority`, `tailwind-merge` (`cn()`), `lucide-react` icons, `framer-motion`.
- **Sources of truth:** [tailwind.config.js](tailwind.config.js), [src/index.css](src/index.css), [src/components/ui/](src/components/ui/), [components.json](components.json).
- **Platforms:** Mobile-first web app wrapped with Capacitor (iOS/Android). The marketing site in [website/](website/) has its own token set (see §9).

---

## 1. Principles

1. **Mobile first, single column.** All app content sits in a `max-w-lg` column. It is never wider than a phone, even on desktop.
2. **Photography leads.** Trip imagery carries the emotion. The UI chrome stays neutral (white and slate).
3. **One accent at a time.** Indigo is used for interaction and selection. Coral is used for urgency and deals. Emerald is used for savings and success.
4. **Soft and rounded.** Use generous radii (`rounded-xl` to `rounded-3xl`), light borders and subtle shadows.
5. **Accessible by default.** Every interactive element gets a visible focus ring. Icon buttons have an `aria-label`. Toggles use `aria-pressed`.

---

## 2. Color tokens

### 2.1 Semantic (CSS variables → Tailwind)

Defined as HSL channels in [src/index.css](src/index.css) and used as `bg-primary`, `text-muted-foreground`, and so on.

| Token | HSL | Approx. hex | Use |
|---|---|---|---|
| `background` | `0 0% 100%` | `#FFFFFF` | Page surface |
| `foreground` | `0 0% 3.9%` | `#0A0A0A` | Default text |
| `primary` | `245 58% 51%` | `#4338CA` | Selection, links, active tab, prices, slider range |
| `primary-foreground` | `0 0% 98%` | `#FAFAFA` | Text on primary |
| `secondary` / `muted` / `accent` | `0 0% 96.1%` | `#F5F5F5` | Quiet fills, ghost/outline hover |
| `muted-foreground` | `0 0% 45.1%` | `#737373` | Captions, helper text, placeholders |
| `destructive` | `0 84.2% 60.2%` | `#EF4444` | Destructive actions |
| `border` / `input` | `0 0% 89.8%` | `#E5E5E5` | Default borders, input outlines |
| `ring` | `245 58% 51%` | `#4338CA` | Focus ring |
| `card` / `popover` | white | `#FFFFFF` | Elevated surfaces |

### 2.2 Brand palette

| Tailwind class | Hex | Role |
|---|---|---|
| `brand` (`brand-DEFAULT`) | `#4338CA` | Indigo. Same value as `primary`. Theme color, splash. |
| `brand-deep` | `#312E9E` | Gradient end for splash and hero surfaces |
| `brand-navy` | `#0F172A` | Default (primary CTA) button, darkest ink |
| `brand-coral` | `#F97316` | "Best Deal" badge, coral CTA, logo dot |
| `brand-emerald` | `#10B981` | "Included", savings, positive price state |

### 2.3 Supporting Tailwind palettes in use

- **Slate** is the neutral ramp for all UI text and lines:
  - `slate-900`: headings and primary text
  - `slate-700`: labels and secondary buttons
  - `slate-600`: unselected chips
  - `slate-500`: close icons
  - `slate-400`: inactive tab
  - `slate-200`: borders, dividers, skeleton
  - `slate-100`: hover fills
  - `slate-50`: page gradient top
- **Rose** is for error and danger:
  - `text-rose-600`: inline errors
  - `bg-rose-500`: "Limited" badge
  - `text-rose-500`: saved heart
- **Emerald** is for success:
  - `bg-emerald-100` with `text-emerald-600`: success icon circle
  - `bg-emerald-500`: "Price Drop" badge
- **Amber** is for notices: `bg-amber-50` with `text-amber-800` (demo-mode banner).

### 2.4 Gradients and overlays

| Name | Classes |
|---|---|
| App background | `bg-gradient-to-b from-slate-50 to-white` |
| Image scrim (cards) | `bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-slate-900/10` |
| Splash / hero | `bg-gradient-to-br from-brand to-brand-deep` |
| Sheet overlay | `bg-slate-900/40 backdrop-blur-sm` |
| Frosted chrome | `bg-white/80 backdrop-blur-xl` (header), `bg-white/90 backdrop-blur-xl` (bottom nav) |

---

## 3. Typography

- **Family (app):** the system stack, `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. This matches native SF Pro or Roboto inside Capacitor.
- **Smoothing:** `antialiased` on `body`.

| Role | Classes | Example |
|---|---|---|
| Splash wordmark | `text-2xl font-extrabold tracking-tight` | "Weekndrr" |
| Page / status title | `text-xl font-bold text-slate-900` | "Check your inbox" |
| Card title (on image) | `text-xl font-bold text-white drop-shadow` | Destination |
| Hero price | `text-2xl font-bold` | `$275` |
| Total price | `text-xl font-bold text-primary` | Price breakdown total |
| Header title | `text-base font-semibold text-slate-900` | Sub-page header |
| Sheet title | `text-lg font-semibold text-slate-900` | "Filters" |
| Section heading | `text-sm font-semibold text-slate-900` | "When do you want to go?" |
| Body | `text-sm text-slate-900` / `text-muted-foreground` | Descriptions |
| Label | `text-sm font-medium leading-none text-slate-700` | Form labels |
| Caption | `text-xs text-muted-foreground` | Date ranges, ratings |
| Micro | `text-[11px] font-medium` | Tab labels, price source |
| Error | `text-xs font-medium text-rose-600` (field), `text-sm font-medium text-rose-600` (form) | Validation |

Inputs use `text-base` (16px). This stops iOS from zooming on focus. Do not go smaller.

---

## 4. Spacing, layout and shape

### Layout

- **App column:** `mx-auto w-full max-w-lg`
- **Horizontal gutter:** `px-4`
- **Bottom clearance when the tab bar shows:** `pb-24`
- **Section rhythm:** `space-y-4` to `space-y-6` between blocks, `gap-3` inside rows, `gap-2` for chips
- **Horizontal scrollers:** `no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4`. These bleed to the screen edge but keep the gutter.

### Safe areas (custom utilities in [src/index.css](src/index.css))

| Utility | Purpose |
|---|---|
| `pt-safe` | Sticky headers under the notch or Dynamic Island |
| `pb-safe` | Bottom nav above the home indicator |
| `bottom-nav-safe` | Floating elements placed above the tab bar (`66px` + inset) |
| `no-scrollbar` | Hides scrollbars on horizontal rails |

### Radius scale

| Token | Value | Used for |
|---|---|---|
| `rounded-sm` / `md` / `lg` | `var(--radius)` = 0.5rem (−4 / −2 / 0) | shadcn defaults (rarely used) |
| `rounded-lg` | 0.5rem | Small buttons (`size="sm"`), logo |
| `rounded-xl` | 0.75rem | **Buttons, inputs**, notice banners |
| `rounded-2xl` | 1rem | **Cards**, trip images, weekend tiles, skeletons |
| `rounded-t-3xl` | 1.5rem | Bottom sheets |
| `rounded-full` | pill | Chips, badges, icon buttons, location pill |

### Elevation

| Level | Classes | Used for |
|---|---|---|
| 0 | none plus `border-slate-200` | Unselected tiles and chips |
| 1 | `shadow-sm` | Cards, inputs, outline buttons, selected tile |
| 2 | `shadow` | Primary buttons, badges, floating heart |
| 3 | `shadow-md` | Slider thumb |
| 4 | `shadow-2xl` | Bottom sheet |

Borders are always hairline: `border` with `border-slate-200` or `border-slate-200/80` on cards, and `/70` on headers.

---

## 5. Iconography

- **Library:** `lucide-react`. Do not mix in other icon sets.
- **Sizes:**
  - `h-3.5 w-3.5`: inside badges
  - `h-4 w-4`: inline with text, inputs, pills
  - `h-5 w-5`: tab bar, header actions, heart
  - `h-8 w-8`: status illustrations, inside a `h-16 w-16 rounded-full` tinted circle
- Always add `aria-hidden="true"` to decorative icons.
- **Accent rules:**
  - Section-leading icons use `text-primary`.
  - Filled states pass `fill="currentColor"`, for example a saved heart or the active Saved tab.
- **Common glyphs:**
  - Navigation: `Search` (Explore), `Heart` (Saved), `User` (Profile)
  - Search and context: `MapPin`, `Calendar`, `SlidersHorizontal`
  - Travel mode: `Plane`, `Car`
  - Deal badges: `Sparkles`, `TrendingDown`, `AlertCircle`
  - Utility: `Loader2` (with `animate-spin`), `X`, `ArrowLeft`, `Eye` / `EyeOff`, `Info`, `MailCheck`

---

## 6. Motion

| Pattern | Spec |
|---|---|
| Page enter | `framer-motion` `initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}`, 0.2s |
| List item enter / exit | `y: 12 → 0`, exit `y: -8`, 0.25s, `layout` enabled |
| Splash | Scale `0.85 → 1` over 0.5s ease-out, fade out over 0.45s. Three dots pulse at 1.1s with a 0.16s stagger. |
| Sheet | `tailwindcss-animate`: slide in from bottom over 300ms, slide out over 200ms. Overlay fades. |
| Micro | `transition-colors` (default, 150ms), `hover:scale-105` on floating icon buttons |
| Loading | `animate-pulse` (skeletons, "Detecting location…"), `animate-spin` (spinners) |

Keep durations at 300ms or less for UI and no more than 500ms for brand moments.

---

## 7. Component library ([src/components/ui](src/components/ui))

Import from the barrel: `import { Button, Card, Chip } from "@/components/ui";`. Individual paths still work.

### Button: [button.jsx](src/components/ui/button.jsx)

Base: `rounded-xl text-sm font-medium`, focus ring, `disabled:opacity-50`.

| `variant` | Look | When |
|---|---|---|
| `default` | Navy fill, white text | Main CTA ("Show results", "Sign in") |
| `primary` | Indigo fill | Brand-forward CTA |
| `coral` | Coral fill | Booking or deal CTA (one per screen) |
| `outline` | White, `border-input` | Secondary action ("Clear", "Back to sign in") |
| `secondary` | Light gray fill | Tertiary |
| `ghost` | Transparent | Toolbar actions |
| `link` | Indigo text, underline on hover | Inline links |

| `size` | Height | Notes |
|---|---|---|
| `sm` | 36px (`h-9`) | `rounded-lg text-xs` |
| `default` | 40px (`h-10`) | |
| `lg` | 48px (`h-12`) | `text-base`. Use for full-width form submits. |
| `icon` | 40×40 | Needs `aria-label` |

`asChild` renders through Radix `Slot`, for example `<Button asChild><Link to="/signin">…</Link></Button>`.

Loading state: set `disabled` and render `<Loader2 className="h-4 w-4 animate-spin" />` plus a present-tense label ("Signing in…").

### Card: [card.jsx](src/components/ui/card.jsx)

`rounded-2xl border border-slate-200/80 bg-card shadow-sm`. Sub-parts are `CardHeader` (`p-4`), `CardTitle` (`font-semibold tracking-tight`) and `CardContent` (`p-4 pt-0`). Many surfaces repeat the same recipe inline as `rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm`. Prefer `<Card>` for new work.

### Input: [input.jsx](src/components/ui/input.jsx)

`h-11 rounded-xl border-input bg-white px-3 text-base shadow-sm`. On error, pass `aria-invalid` and `aria-describedby` that point to an `id="{field}-error"` message. Password fields add a trailing 44px show/hide toggle (`pr-11`).

### Label: [label.jsx](src/components/ui/label.jsx)

Radix Label, `text-sm font-medium text-slate-700`. Stack it with the input inside `space-y-1.5`.

### Sheet: [sheet.jsx](src/components/ui/sheet.jsx)

A bottom sheet built on Radix Dialog. It is the **only modal pattern** in the app.

- **Overlay:** `bg-slate-900/40 backdrop-blur-sm`
- **Panel:** `rounded-t-3xl`, `max-h-[85vh]`, `max-w-lg`, `p-5 pb-8`, `shadow-2xl`, with a 40×6 grab handle
- **Close button:** top-right `X`
- **Content order:** `SheetHeader` (`SheetTitle` + `SheetDescription`), then a scrollable body, then a footer button row (`flex gap-3`, buttons `flex-1`)

### Slider: [slider.jsx](src/components/ui/slider.jsx)

Radix Slider. The track is `h-2 bg-slate-200` with a `bg-primary` range. The thumb is 24px, white with a primary border and `shadow-md`.

### Skeleton: [skeleton.jsx](src/components/ui/skeleton.jsx)

`animate-pulse rounded-2xl bg-slate-200/70`. Match the shape of the content it replaces, for example `aspect-[4/5]` for trip cards.

### Badge: [badge.jsx](src/components/ui/badge.jsx)

Pill label, `rounded-full px-3 py-1 text-xs font-semibold`.

| `variant` | Use |
|---|---|
| `coral` | "Best Deal" |
| `success` | "Price Drop" |
| `danger` | "Limited" |
| `primary` | Generic emphasis |
| `soft` | Indigo tint, counts and tags |
| `neutral` | Default, metadata |

### Chip: [chip.jsx](src/components/ui/chip.jsx)

A toggle pill for filters, `rounded-full border px-4 py-2 text-sm font-medium`. Pass `active` to switch states; the component sets `aria-pressed` for you.

- **Active:** `border-primary bg-primary/10 text-primary`
- **Inactive:** `border-slate-200 bg-white text-slate-600`

---

## 8. Patterns (composed)

| Pattern | Reference | Recipe |
|---|---|---|
| **Sticky header** | [Home.jsx](src/pages/Home.jsx), [AuthScreen.jsx](src/pages/AuthScreen.jsx) | `sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl pt-safe`. Back button: `rounded-full p-2 hover:bg-slate-100` with `ArrowLeft`. |
| **Bottom tab bar** | [Layout.jsx](src/Layout.jsx) | `fixed bottom-0 z-40 border-t bg-white/90 backdrop-blur-xl pb-safe`. Three equal tabs. Active `text-primary`, inactive `text-slate-400`. `text-[11px]` labels. Hidden in checkout and auth flows. |
| **Location pill** | [Home.jsx](src/pages/Home.jsx) | `rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium shadow-sm` with a `MapPin text-primary` icon |
| **Trip card** | [TripCard.jsx](src/components/trips/TripCard.jsx) | `aspect-[4/5] rounded-2xl` image, bottom scrim, top-left `Badge`, top-right frosted heart (`rounded-full bg-white/90 p-2 shadow backdrop-blur`), white title and price on the image, lodging meta below |
| **Selectable tile** | [WeekendPicker.jsx](src/components/search/WeekendPicker.jsx) | `min-w-[140px] rounded-2xl border p-3`. Active: `border-primary bg-primary/5 shadow-sm`, title `text-primary`. |
| **Price breakdown** | [PriceBreakdown.jsx](src/components/trips/PriceBreakdown.jsx) | Card with line items (`py-1.5`, label + caption left, `font-semibold` amount right), a `h-px bg-slate-200` divider, and a total in `text-xl font-bold text-primary`. "Included" uses `text-brand-emerald`. |
| **Status screen** | [AuthScreen.jsx](src/pages/AuthScreen.jsx) | Centered `px-6 py-20 text-center`. `h-16 w-16 rounded-full` tinted icon circle, `text-xl font-bold` title, `text-sm text-muted-foreground` body, then a button. |
| **Notice banner** | [AuthScreen.jsx](src/pages/AuthScreen.jsx) | `flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800` with a leading icon |
| **Form** | [AuthScreen.jsx](src/pages/AuthScreen.jsx) | `space-y-4`. Field = `Label` + `Input` + error. Full-width `size="lg"` submit. `role="alert"` on form-level errors. |
| **Splash** | [SplashGate.jsx](src/components/SplashGate.jsx) | Indigo gradient, white "W" mark with a coral dot, wordmark, tagline in `text-white/75`, pulsing dots |

---

## 9. Marketing site tokens ([website/styles.css](website/styles.css))

The landing page uses an editorial, warmer palette. Do not import these tokens into the app.

| Variable | Value | Role |
|---|---|---|
| `--paper` | `#F6F4EF` | Page background (warm off-white) |
| `--white` | `#FFFDF9` | Surfaces |
| `--ink` | `#17202B` | Text |
| `--muted` | `#65717B` | Secondary text |
| `--indigo` / `--deep-indigo` | `#4338CA` / `#312E9E` | Shared with the app brand |
| `--orange` | `#F97316` | Shared with `brand-coral` |
| `--line` | `rgba(23,32,43,.14)` | Rules |
| `--display` | **Space Grotesk** 500–700 | Headlines, tight tracking (`-0.065em`) |
| `--body` | **DM Sans** 400–700 | Body |

Shared DNA between the app and the site: indigo with an orange accent, the "W" mark with its orange dot, and the italic-free `<em>` emphasis in indigo.

---

## 10. Accessibility checklist

- [ ] Focus ring: `focus-visible:ring-2 ring-ring ring-offset-2`. A global fallback lives in `index.css`.
- [ ] Icon-only buttons have an `aria-label`. Decorative icons have `aria-hidden`.
- [ ] Toggles (chips, tiles, heart) expose `aria-pressed`.
- [ ] Inputs link their errors through `aria-invalid` and `aria-describedby`.
- [ ] Tap targets are at least 40px (`h-10`). Primary actions are 44px or more.
- [ ] Text on photos sits on the `slate-900/80` scrim, with `drop-shadow` on headlines.
- [ ] Respect safe areas: headers use `pt-safe`, the tab bar and fixed footers use `pb-safe`.

---

## 11. Contributing

1. Add new primitives with the shadcn CLI (`npx shadcn@latest add <component>`). `components.json` is already configured for JS, `new-york` style and the `@/` aliases. Then restyle the result to match the radius and border rules above.
2. Use semantic tokens (`primary`, `muted-foreground`, `border`) or `brand-*` before reaching for raw hex values. Avoid arbitrary values like `bg-[#4338CA]`.
3. Compose classes with `cn()` from [src/lib/utils.js](src/lib/utils.js) so `tailwind-merge` resolves conflicts.
4. Export every new primitive from [src/components/ui/index.js](src/components/ui/index.js) and document it in §7.
