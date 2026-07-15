# Code target — EHSQ-E "Miramar" (Vue 3 + Vuetify 3, Options API, plain JS)

You are producing a **starting-point coded component** a Miramar developer could drop into the
real EHSQ-E front end and refine. It is NOT claimed to be final or tested — it is a faithful
first implementation in the exact house style. Match the conventions below precisely; generic
"modern Vue 3" will be rejected.

**Hard framework rules (non-negotiable — the whole 541-component codebase follows these):**
- **Vue 3 Single-File Component in the Options API.** `export default { … }`. NO `<script setup>`,
  NO Composition API, NO `defineProps`/`defineComponent`/`ref`/`computed()`.
- **Plain JavaScript. NO TypeScript** — never `lang="ts"`, no type annotations.
- SFC block order: `<template>` → `<script>` → `<style>`.
- No file-header comment; open directly with `<template>`.

**Component conventions:**
- Export keys in order: `emits`, `mixins`, `components`, `props`, `data()`, `computed`, lifecycle
  hooks, `methods`.
- Props: object map with `{ type, default }`. Booleans default `false`; object/array defaults use a
  factory (`default: () => ({})`). `v-model` = a `modelValue` prop + `emits: ['update:modelValue']`.
- `emits: [...]` as a string array (declare it, usually first). Custom event names are **kebab-case**
  (`row-select`, `close-dialog`).
- **Reuse logic via a mixin**, not a composable — reference it as `mixins: [fooMixin]` and note it
  should live at `src/mixins/foo.js`. Assume the app-wide `dway` global mixin already provides
  `this.global`, `this.screenMode`, `isTabOrMobileView` etc. — use them; do not import or redefine them.
- Register child components lazily: `components: { Foo: defineAsyncComponent(() => import('@/components/…')) }`
  (the `@/` alias = `src/`). Import `defineAsyncComponent` from `vue`.
- Module-scoped constants (`UPPER_SNAKE`) go between the imports and `export default`, not in `data()`.
- Use `window.$localStorageHandler` for persistence — never `localStorage` directly.
- State: read via Vuex `mapState`/`this.$store.state`, write via `this.$store.commit(...)`, async via
  `mapActions`/`this.$store.dispatch(...)`. Data fetching uses the injected axios instances
  `this.$http` (YWServices, form-encoded) or `this.$services` (SearchAPI, JSON) — never a bare
  `import axios`.

**UI — use the real design system (Vuetify 3 + local wrappers), don't invent components:**
- Prefer Vuetify tags directly: `v-card`/`v-card-title`/`v-card-text`, `v-btn`, `v-icon`, `v-text-field`,
  `v-select`, `v-autocomplete`, `v-checkbox`, `v-switch`, `v-list`/`v-list-item`, `v-dialog`, `v-menu`,
  `v-tooltip`, `v-tabs`/`v-tab`/`v-window`, `v-chip`, `v-divider`, `v-row`/`v-col`, `v-data-table`.
- For form inputs prefer the globally-registered Miramar wrappers (no import needed):
  `CustomTextField`, `CustomBtn`, `CustomSelect`, `CustomAutocomplete`, `CustomCheckbox`,
  `CustomDateField`, `CustomDialog`, `CustomTable`, `CustomFieldLabel`, `UserSelector`, `RoleSelector`.
- **Icons: Material Design Icons** as strings in `<v-icon>` — `mdi-content-save`, `mdi-magnify`,
  `mdi-close`, `mdi-plus-circle-outline`, etc.
- Accessibility: use the global `v-accessibility="$t('ALTTAGS_…')"` directive on interactive elements
  (it sets aria-label/alt); otherwise rely on Vuetify's built-in roles. Do NOT hand-roll ARIA that
  Vuetify already provides.

**Styling:**
- `<style lang="sass">` (indented Sass) — usually **unscoped** (add `scoped` only if the component is
  truly self-contained). Namespace custom classes BEM-with-prefix: `mmar__block--modifier`.
- **Never hardcode hex.** Use theme tokens as `rgb(var(--v-theme-NAME))` — real names include
  `primary`, `secondary`, `focus`, `error`, `text`, `dwayoffwhite`, `dwaygray4`, `dwaylightgray2`,
  `dwaybackground2`, `dwayfieldoutline`, `dwayrequired`, `accent1`–`accent4`, `igColor1`–`igColor6`.
  Auto-injected Sass vars (use bare): `$dwo-gutter` (16px), `$breakpoint-tablet` (1400px),
  `$breakpoint-mobile` (1000px). Typography is Gilroy (already wired via `--body-font-family`).

**i18n (mandatory):**
- Every user-facing string uses `$t('KEY')` in templates / `this.$t('KEY')` in script (vue-i18n).
- Do NOT hardcode English. List the new keys the developer must add to `src/locales/en.json` (and its
  language siblings), following the nearest module's namespace style.

**Style/format (ESLint essential — not enforced, so honor by hand):** single quotes, NO semicolons,
2-space indent, one attribute per line for multi-attribute elements. Component filename PascalCase.

**Do NOT ship tests** — Miramar has no test suite (QA is manual). Testing guidance belongs to the QA
artifact, not this code.

**Output — ONE Markdown document, in this order:**
1. Banner: `> ⚠️ Starting point — review required. Generated from the change brief; matches Miramar (Vue/Vuetify Options API) conventions but not tested.`
2. **What this implements** — 2–3 lines tying it to the brief and naming the Vuetify/wrapper components used.
3. The **`.vue` component** in a single fenced ```vue block: `<template>` → `<script>` (plain JS Options
   API) → `<style lang="sass">`. Include props, emits, key states/interactions, and responsive handling
   (`this.screenMode`) from the brief.
4. **i18n keys to add** — the `$t` keys used and their English values, for `src/locales/en.json`.
5. **Where it goes** — the target paths (`src/components/<Feature>/<Feature>.vue`, mixin at
   `src/mixins/…`, route/store notes if relevant).
6. **To verify / TODO** — data wiring (real `$http`/`$services` endpoints), the brief's open questions,
   and anything assumed for lack of a real endpoint or DS component.

**Must:** Options API + plain JS; real Vuetify/Custom components + MDI icons + theme tokens; `$t` for all
text; label clearly as a starting point.
**Must avoid:** `<script setup>`, TypeScript, composables, hardcoded hex/strings, invented "@ideagen/…"
Vue components, direct `localStorage`, shipping tests.
