# Target front-end conventions — Ideagen EHSQ-E ("Miramar")

Distilled from a study of the real Miramar front-end repo (the EHSQ-E Vue UI) on
2026-07-15. This is the house style generated code must match to be mergeable by the
Miramar developers. The repo ships its own `CLAUDE.md`; this doc is the harness-facing
summary. **When code is generated for EHSQ-E, follow this — not generic modern Vue.**

## Framework verdict (the big one)
- **Vue 3 + Vuetify 3, authored in the Options API — always.** 541 `.vue` files, **zero**
  `<script setup>`, zero Composition API, zero `defineComponent`. The project explicitly
  forbids Composition API ("Options API is fine"); a `<script setup>` component would be the
  only one in the codebase and fail review.
- **Plain JavaScript. No TypeScript.** No `tsconfig`, no `.ts`, no `lang="ts"`. Do not emit types.
- React deps exist ONLY for two Helix-AI bridge islands (`Mazlan/Connector.jsx`); the `webfiles/`
  build is legacy ExtJS. Ignore both — standard UI is Vue Options API.

## Component authoring
- SFC block order: `<template>` → `<script>` → `<style>`. No file-header comment.
- `export default { … }` with keys typically in this order: `emits`, `mixins`, `components`,
  `props`, `data()`, `computed`, lifecycle, `methods`.
- **Props**: object map with `{ type, default }`; booleans default `false`; object/array defaults
  via factory (`default: () => ({})`). `v-model` wired via `emits: ['update:modelValue']` + a
  `modelValue` prop.
- **`emits: [...]`** declared as a string array (often first). Custom event names are **kebab-case**
  (`open-editor`, `dialog-close`); `update:modelValue` for v-model.
- **Code reuse = mixins** in `src/mixins/` (camelCase `.js`), NOT composables. A global `dway`
  mixin (`app.mixin` in `main.js`) injects `this.global`, `this.screenMode`, `isTabOrMobileView`,
  etc. into every component — assume these exist; do not import them.
- **Child components lazy-loaded**: `components: { Foo: defineAsyncComponent(() => import('@/components/…')) }`.
  Use the `@/` alias (= `src/`), not relative `../`.
- Module-scoped constants (`UPPER_SNAKE`) between imports and `export default` — not in `data()`.
- Filenames **PascalCase.vue**; single-word names are allowed (lint rule disabled).
- `window.$localStorageHandler` — never `localStorage` directly.

## Styling & tokens
- Styles in SFC `<style lang="sass">` (**indented Sass, dominant**) or `scss`; **often UNSCOPED**
  (scoped is the minority). Sass project variables are auto-injected — use `$dwo-gutter` (16px),
  `$swl-side-width`, `$breakpoint-tablet` (1400px), `$breakpoint-mobile` (1000px) bare, no import.
- **Never hardcode hex.** Colors come from Vuetify theme tokens consumed as
  `rgb(var(--v-theme-NAME))`, defined in `src/theme.js` (full light + dark). Real names:
  `primary`, `secondary`, `focus`, `error`, `text`, `headertext`, `dwayoffwhite`, `dwaywhite`,
  `dwaygray`/`dwaygray1..6`, `dwaylightgray2`, `dwaybackground2`, `dwayfieldoutline`, `dwayrequired`,
  `dwaylinkblue`, `accent1..4`, `igColor1..6`, `mmarDTNeutral02`, `tableHeader/tableBorder/tableHover`,
  `insightChanged`+`on-insightChanged`, chart ramps `highCharts1..13`. In JS:
  `this.$vuetify.theme.themes.light.colors['NAME']`.
- **Class naming = BEM-with-subsystem-prefix**: `mmar__block--modifier`, `dwo__…`, `custom__…`.
  Override Vuetify internals within a namespaced parent (e.g. `.custom__btn .v-btn__content`).
- All app CSS lives in `@layer miramar`.

## Design system = Vuetify 3 + local wrappers (no Helix Vue kit)
- Use Vuetify tags directly: `v-btn`, `v-icon`, `v-card`/`v-card-title`/`v-card-text`/`v-card-actions`,
  `v-text-field`, `v-select`, `v-autocomplete`, `v-checkbox`, `v-switch`, `v-textarea`, `v-list`/`v-list-item`,
  `v-dialog`, `v-menu`, `v-tooltip`, `v-tabs`/`v-tab`/`v-window`/`v-window-item`, `v-chip`, `v-divider`,
  `v-row`/`v-col`/`v-container`, `v-data-table`, `v-expansion-panels`, `v-skeleton-loader`,
  `v-progress-linear`/`v-progress-circular`, `v-snackbar`.
- **Globally-registered internal wrappers (no import needed)** — prefer these for forms:
  `CustomTextField`, `CustomBtn`, `CustomSelect`, `CustomAutocomplete`, `CustomCombobox`,
  `CustomCheckbox`, `CustomDateField`, `CustomDialog`, `CustomTable`, `CustomList`, `CustomFieldLabel`,
  `CustomPopupPanel`, `UserSelector`, `RoleSelector`, `TeamSelector`, `TwoColumnSelector`
  (`src/components/CustomInputs/`); `Mmar*` (`src/components/mmar/`), `Dw*` (`src/components/custom/`),
  `dwo-cmp-*` (`src/components/dwo/cmp/`).
- **Icons = Material Design Icons** as strings inside `<v-icon>`: `mdi-close`, `mdi-magnify`,
  `mdi-content-save`, `mdi-plus-circle-outline`, … Custom SVGs via Vuetify aliases `$aiIcon`,
  `$ideagenHubIcon`, `$dashboardEditIcon`.
- **Typography = Gilroy** (`--body-font-family: "Gilroy", Verdana, sans-serif`), root 14px. Never substitute.

## i18n (near-universal — treat hardcoded UI text as a defect)
- `vue-i18n` v11 (`legacy: false`, `globalInjection: true`). Every user-facing string uses
  `$t('KEY')` in templates / `this.$t('KEY')` in script.
- Translation files: `src/locales/en.json` (+ `fr/de/es/it/ko/pl/pt/th/tr/zh`). New keys follow the
  nearest module's namespace object (`Admin.AddComponent`); some legacy keys are UPPER_SNAKE
  (`ADVANCEDSEARCH_SELECTDATE`). Generated code should reference `$t` keys AND list the new keys to add.

## Two global directives to use
- **`v-accessibility="$t('ALTTAGS_…')"`** — sets aria-label/alt/id (the app's a11y mechanism).
- **`v-gs-id="'area.action.verb'"`** — Gainsight PX tracking id. **This is Miramar's native analytics
  hook** — the harness's instrumentation plan should emit `v-gs-id` here (see proposal), not a raw `data-id`.

## State & data
- **State = Vuex 4** (`mapState`/`mapActions`/`mapMutations`; namespaced modules auto-registered by
  dropping `src/store/modules/<name>/{state,actions,mutations,getters}.js`), plus a `shared/global.js`
  reactive singleton (`this.global`) for cross-cutting flags. (The codebase also mutates
  `this.$store.state.x` directly as a Vue-2-parity habit — don't emulate that; prefer commit/dispatch.)
- **Data = injected axios instances**, never a direct `import axios`: `this.$http` (YWServices,
  form-encoded, auto-tenant), `this.$services` (SearchAPI, JSON), `this.$rest`. Reusable payloads go in
  `src/utils/servletDefaults.js`. Abortable fetches use axios `CancelToken`. Interceptors handle
  auth/CSRF/401/unwrap — expect the response to already be unwrapped to `.data`.
- **Routing = vue-router 4**: lazy-loaded route components, every path prefixed `/:shortcode`, most
  routes are children of the `views/dashboard/Index.vue` shell, each with `meta.title` (an i18n key).

## Lint / format / tests
- ESLint **flat/essential** only (+ `eslint-plugin-vuetify`); no stylistic rules, **no Prettier**.
  De-facto `.vue` style: **single quotes, no semicolons, 2-space indent, one attribute per line**.
- `vue/multi-word-component-names`, `vue/no-mutating-props`, `vue/no-v-text-v-html-on-component` are OFF.
- **No automated tests exist** — QA is manual + cross-browser + Vue-2 parity (per `CLAUDE.md`). Generated
  dev code should NOT ship test files; testing guidance belongs in the separate QA artifact.

## Where new code lives
`src/components/<Feature>/<Feature>.vue` (+ sub-components in the same folder). Reusable logic →
`src/mixins/<feature>.js`. Shared state → a namespaced Vuex module. Route → a lazy child of the
dashboard shell in `src/router.js`. i18n keys → `src/locales/en.json` (+ siblings).

## What a generic "modern Vue 3" generator gets WRONG here
1. `<script setup>` / Composition API / `defineProps` — forbidden; must be Options API.
2. TypeScript / `lang="ts"` — must be plain JS.
3. Scoped plain-CSS `<style scoped>` — should default to unscoped `<style lang="sass">` with prefixed BEM.
4. Hardcoded hex or naive Vuetify color props — must use `rgb(var(--v-theme-NAME))` tokens.
5. Composables (`useX.js`) — must be mixins.
6. Eager child imports — must be `defineAsyncComponent(() => import('@/…'))`.
7. Hardcoded English text — must be `$t('KEY')` with keys added to `src/locales`.
8. Generic `data-id` for analytics — Miramar uses the `v-gs-id` directive.
9. Direct `localStorage` — must use `window.$localStorageHandler`.
10. A non-MDI icon set; substituting a non-Gilroy font.
11. Shipping tests / a test framework — Miramar has none.
12. Importing an invented "@ideagen/…" Vue DS — the Vue DS is Vuetify + the local `Custom*`/`Dwo*` wrappers.
