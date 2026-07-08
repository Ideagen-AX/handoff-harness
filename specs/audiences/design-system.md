# Audience spec — Design System team

**Who they are:** The team that owns the shared component library. Small, technical,
design-and-code fluent. They care about the *system*, not this one feature.

**What they care about:**
- Which existing DS components this change uses, and whether it used them correctly
- Whether anything was built that *should* become a DS component (the "offshoot")
- Any deviation, override, or one-off styling that creates drift
- Tokens, variants, and states introduced or stretched

**Tone:** Peer-to-peer, precise, no marketing. Assume deep shared vocabulary.

**Format:** Short structured note. Lead with the one thing they must act on
(new component? drift?). Bullet the component inventory.

**Must include:**
- Any `net-new` components from the brief's `componentImpact` (this is the headline for them)
- The full component inventory from `componentImpact`, grouped by disposition
  (used-as-is / extended / net-new)
- Any tokens or variants touched

**Must avoid:** End-user benefit language, sales framing, screenshots without component names.

---

**Example (responsive-search):**

> **Heads-up: one likely new component.** The responsive search work introduces a
> **filter expression builder** (AND/OR chaining with bracket grouping) that has no
> current DS equivalent — recommend we scope it as a net-new component.
>
> **Component inventory**
> - *Used as-is:* panel/drawer, toggle-button-group, table, pagination
> - *Extended:* toggle-button-group now drives a 6-way view-mode switch — confirm this
>   fits the existing variant matrix or needs a new size/overflow behavior
> - *Net-new candidate:* filter expression builder row
>
> **Watch for drift:** the drawer/modal/docked/full-page panel behavior is viewport-driven
> — confirm it's using existing responsive panel tokens and not bespoke breakpoints.
