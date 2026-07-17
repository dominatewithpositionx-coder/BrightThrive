# BrytThrive Product Operating System

> **Status:** Active
> **Last updated:** July 17, 2026 (rev 2)

The Product Operating System defines how BrytThrive makes decisions. It translates the [Constitution](./01-CONSTITUTION.md) and [Product Bible](./02-PRODUCT-BIBLE.md) into day-to-day operating practice.

Every product proposal, engineering ticket, design review, and AI behavior change must pass through these checkpoints before implementation begins.

---

## Governance Rule

> **Before proposing or implementing any feature, verify that it aligns with:**
>
> - [01-CONSTITUTION.md](./01-CONSTITUTION.md) — Governing principles
> - [02-PRODUCT-BIBLE.md](./02-PRODUCT-BIBLE.md) — Living product vision
> - [03-PRODUCT_OPERATING_SYSTEM.md](./03-PRODUCT_OPERATING_SYSTEM.md) — This document
> - [04-DESIGN_PRINCIPLES.md](./04-DESIGN_PRINCIPLES.md) — UX standards
> - [05-AI_PRINCIPLES.md](./05-AI_PRINCIPLES.md) — AI behavior standards
> - [06-DECISION_FRAMEWORK.md](./06-DECISION_FRAMEWORK.md) — Evaluation scorecard
>
> **If a proposal conflicts with a governing principle:**
> 1. Explain the conflict clearly.
> 2. Recommend a redesign.
> 3. If necessary, recommend a Constitutional Amendment before implementation.

---

## Permanent Product Questions

These questions are mandatory at every product review, sprint kickoff, design critique, and AI change. They do not expire or rotate.

### Acquisition
**Does this improve the probability that a new family discovers BrytThrive?**

### Activation
**Does this improve the probability that a new family achieves their first Family Win?**

### Retention
**Does this increase the probability that a family returns tomorrow?**

### Revenue
**Does this increase the probability of earning another paying family?**

### Family Win
**Does this create, accelerate, or deepen a Family Win?**

### Onboarding
**Are we onboarding motivation, or merely collecting data?**

Every field, screen, and step added to onboarding must justify itself by improving the family's first experience — not by feeding internal analytics or deferring product thinking. Onboarding succeeds when a family achieves their first Family Win, not when an account is created.

*Derived from [Article V — Supporting Principle: Onboard Motivation, Not Data](./01-CONSTITUTION.md#supporting-principle-onboard-motivation-not-data)*

### Child Agency
**Does this respect the child's sense of ownership and autonomy?**

A feature that makes the child feel managed, surveilled, or controlled — rather than capable and celebrated — fails this test and must be redesigned.

### Evidence
**What evidence from the [Research Library](./09-RESEARCH_LIBRARY.md) supports this decision?**

Every meaningful product decision should be supported by parent feedback, child behavior, product analytics, scientific literature, controlled experiments, or expert guidance. If no evidence exists, identify the assumption, recommend a pilot, and gather evidence before proceeding.

*Derived from [Article VI — Evidence Before Opinion](./01-CONSTITUTION.md#article-vi--evidence-before-opinion)*

### Child Individuality
**Does this feature preserve each child's identity, autonomy, and progress independently?**

Any feature that touches multiple children must ensure sibling data, wallets, journeys, and AI models remain fully isolated. Sibling comparisons must never be surfaced or encouraged.

*Derived from [Article VII — Every Child is an Individual](./01-CONSTITUTION.md#article-vii--every-child-is-an-individual)*

---

## Constitutional Test (Required for Every Feature)

From [Article V of the Constitution](./01-CONSTITUTION.md#article-v--the-family-journey-principle):

1. Does this strengthen the parent's ability to create a healthy environment?
2. Does this increase the child's sense of ownership and autonomy?
3. Does this allow the AI to learn through authentic behavior rather than unnecessary data collection?

If the answer to any of these questions is no, the feature should be redesigned before it enters development.

---

## The Family Win Definition

A Family Win is the atomic unit of BrytThrive's success metric.

A Family Win occurs when:

1. A child completes their first (or next) mission.
2. A parent notices and recognizes that effort.
3. The child feels seen, proud, and motivated to return tomorrow.

Product work that does not move families toward their first — or next — Family Win is the lowest priority.

---

## What BrytThrive Does Not Build

The following categories are explicitly out of scope unless a future Constitutional Amendment provides a framework:

- AI-generated praise that replaces parent recognition
- Voice messages from the app to a child
- Push or email notifications designed to re-engage without parent intent
- Social mechanics that compare children to each other
- Reward economy redesigns that bypass the parent approval layer
- Full behavioral timelines not tied to a specific family goal
- Diagnostic or clinical language about a child's behavior

---

## Feature Prioritization Tiers

| Tier | Criterion | Action |
|------|-----------|--------|
| P0 | Makes the first Family Win possible | Ship now |
| P1 | Increases Family Win frequency | High priority |
| P2 | Deepens Family Win meaning | Medium priority |
| P3 | Supports retention after 10+ Family Wins | Planned |
| Defer | Useful but not tied to Family Win loop | Backlog |
| Decline | Conflicts with Constitution | Redesign or reject |

---

## Change Management

Any change to this document requires:

1. Agreement from product leadership that the operating question is obsolete or insufficient.
2. A recorded entry in [08-CHANGELOG.md](./08-CHANGELOG.md).
3. An updated version number in the header of this document.

Changes that contradict the [Constitution](./01-CONSTITUTION.md) require a Constitutional Amendment first.
