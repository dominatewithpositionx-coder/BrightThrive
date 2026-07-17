# BrytThrive Decision Framework

> **Status:** Active
> **Last updated:** July 17, 2026

The Decision Framework is a practical evaluation tool for every feature proposal, product change, and technical initiative. It translates the [Constitution](./01-CONSTITUTION.md) and [Product Operating System](./03-PRODUCT_OPERATING_SYSTEM.md) into a structured scoring process.

A feature that scores poorly on this framework should be redesigned before entering development — not after.

---

## Governance Rule

Before proposing or implementing any feature, verify that it aligns with:

- [01-CONSTITUTION.md](./01-CONSTITUTION.md)
- [02-PRODUCT-BIBLE.md](./02-PRODUCT-BIBLE.md)
- [03-PRODUCT_OPERATING_SYSTEM.md](./03-PRODUCT_OPERATING_SYSTEM.md)
- [04-DESIGN_PRINCIPLES.md](./04-DESIGN_PRINCIPLES.md)
- [05-AI_PRINCIPLES.md](./05-AI_PRINCIPLES.md)
- [06-DECISION_FRAMEWORK.md](./06-DECISION_FRAMEWORK.md) *(this document)*

If a proposal conflicts with a governing principle: explain the conflict, recommend a redesign, and — if necessary — propose a Constitutional Amendment before proceeding.

---

## Feature Evaluation Scorecard

For every feature proposal, answer each dimension with: **Strong Yes / Yes / Neutral / No / Strong No**.

A **Strong No** on any constitutional dimension (rows marked ⚠️) requires a redesign before the proposal advances.

### Acquisition

**Does this feature improve the probability that a new family discovers or chooses BrytThrive?**

*Consider: SEO, referral, word-of-mouth, shareability, first impression.*

---

### Activation

**Does this feature improve the probability that a new family achieves their first Family Win?**

*Consider: time-to-first-mission, onboarding clarity, first child experience, first parent recognition moment.*

---

### Retention

**Does this feature increase the probability that a family returns tomorrow — and the day after?**

*Consider: streak mechanics, habit formation, emotional residue of last session, re-engagement hooks.*

---

### Revenue

**Does this feature increase the probability of a family upgrading or remaining a paying subscriber?**

*Consider: feature differentiation between free/paid tiers, perceived value, willingness to pay.*

---

### Family Win

**Does this feature create, accelerate, or deepen a Family Win?**

*Consider: does this help a child complete a mission, a parent recognize it, and a child feel seen?*

---

### ⚠️ Child Agency

**Does this feature preserve or increase the child's sense of ownership and autonomy?**

*A No here requires redesign.*

*Consider: does the child choose, or are they managed? Does the child feel capable, or surveilled?*

---

### ⚠️ Constitutional Alignment

**Does this feature pass all three questions of the Constitutional Test?**

*A No here requires redesign or a Constitutional Amendment.*

1. Does it strengthen the parent's ability to create a healthy environment?
2. Does it increase the child's sense of ownership and autonomy?
3. Does it allow the AI to learn through authentic behavior rather than unnecessary data collection?

---

### Engineering Complexity

**What is the estimated engineering cost relative to the expected impact?**

*Consider: complexity, reversibility, maintenance burden, dependency risk.*

| Complexity | Definition |
|-----------|-----------|
| Low | Under a day; no schema changes; no new dependencies |
| Medium | 1–3 days; possible schema migration; limited risk |
| High | 3+ days; schema changes; cross-system impact; high risk |

---

### Evidence

**What is the quality of evidence supporting this proposal?**

| Evidence Level | Definition |
|---------------|-----------|
| Observed behavior | Derived from real user interaction data |
| Parent/child feedback | Direct qualitative input from users |
| Hypothesis | Reasoned but untested assumption |
| Speculation | Intuition without supporting data |

Proposals based on speculation that score Neutral or below on acquisition, activation, or retention should be deferred until evidence improves.

---

## Evaluation Summary Template

When submitting a feature proposal, complete the following:

```
## Feature: [Name]

### One-sentence description
[What does this do?]

### Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| Acquisition | | |
| Activation | | |
| Retention | | |
| Revenue | | |
| Family Win | | |
| Child Agency | | |
| Constitutional Alignment | | |
| Engineering Complexity | | |
| Evidence | | |

### Constitutional conflicts (if any)
[List any conflicts with the Constitution and how the proposal addresses them.]

### Recommendation
[ ] Build — proceed to implementation
[ ] Redesign — explain what needs to change
[ ] Defer — explain what evidence or conditions would change the recommendation
[ ] Decline — explain which principle makes this incompatible with BrytThrive
```
