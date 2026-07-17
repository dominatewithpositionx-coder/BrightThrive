# BrytThrive Foundation

> **"The Foundation is the constitutional source of truth for BrytThrive."**

Every AI agent, engineer, designer, and product contributor begins here before making product decisions. If a proposal, implementation, or design choice conflicts with a governing principle in these documents, it must be redesigned — not shipped.

---

## Governance Rule

> **Before proposing or implementing any feature, verify that it aligns with:**
>
> - [01-CONSTITUTION.md](./01-CONSTITUTION.md) — Governing principles
> - [02-PRODUCT-BIBLE.md](./02-PRODUCT-BIBLE.md) — Living product vision
> - [03-PRODUCT_OPERATING_SYSTEM.md](./03-PRODUCT_OPERATING_SYSTEM.md) — Decision checkpoints
> - [04-DESIGN_PRINCIPLES.md](./04-DESIGN_PRINCIPLES.md) — UX standards
> - [05-AI_PRINCIPLES.md](./05-AI_PRINCIPLES.md) — AI behavior standards
> - [06-DECISION_FRAMEWORK.md](./06-DECISION_FRAMEWORK.md) — Feature evaluation scorecard
>
> **If a proposal conflicts with a governing principle:**
> 1. Explain the conflict.
> 2. Recommend a redesign.
> 3. If necessary, recommend a Constitutional Amendment before implementation.

---

## Document Index

| # | File | Purpose | Change frequency |
|---|------|---------|-----------------|
| 01 | [CONSTITUTION.md](./01-CONSTITUTION.md) | Permanent governing principles — changed only through formal amendment | Rarely |
| 02 | [PRODUCT-BIBLE.md](./02-PRODUCT-BIBLE.md) | Living product vision, personas, journeys, system descriptions | Each major release |
| 03 | [PRODUCT_OPERATING_SYSTEM.md](./03-PRODUCT_OPERATING_SYSTEM.md) | How BrytThrive makes product decisions — permanent operating questions | Rarely |
| 04 | [DESIGN_PRINCIPLES.md](./04-DESIGN_PRINCIPLES.md) | UX and visual design standards | Occasionally |
| 05 | [AI_PRINCIPLES.md](./05-AI_PRINCIPLES.md) | How BrytThrive AI must behave | Occasionally |
| 06 | [DECISION_FRAMEWORK.md](./06-DECISION_FRAMEWORK.md) | Structured scorecard for evaluating feature proposals | Occasionally |
| 07 | [GLOSSARY.md](./07-GLOSSARY.md) | Shared vocabulary — the authority on BrytThrive terminology | As needed |
| 08 | [CHANGELOG.md](./08-CHANGELOG.md) | Permanent amendment history | Each amendment |

---

## Reading Order for New Contributors

If you are new to BrytThrive — whether you are an AI agent, an engineer, a designer, or a product manager — read in this order:

1. **[01-CONSTITUTION.md](./01-CONSTITUTION.md)** — Understand what BrytThrive will never compromise on.
2. **[02-PRODUCT-BIBLE.md](./02-PRODUCT-BIBLE.md)** — Understand what BrytThrive is and who it serves.
3. **[03-PRODUCT_OPERATING_SYSTEM.md](./03-PRODUCT_OPERATING_SYSTEM.md)** — Understand how BrytThrive makes decisions.
4. **[07-GLOSSARY.md](./07-GLOSSARY.md)** — Learn the shared vocabulary before writing a line of code or copy.
5. **[06-DECISION_FRAMEWORK.md](./06-DECISION_FRAMEWORK.md)** — Before proposing anything, know how it will be evaluated.
6. **[04-DESIGN_PRINCIPLES.md](./04-DESIGN_PRINCIPLES.md)** and **[05-AI_PRINCIPLES.md](./05-AI_PRINCIPLES.md)** — Apply these to every interface and AI output you build.

---

## What Governs What

| Area of work | Primary governing document(s) |
|-------------|------------------------------|
| Any new feature proposal | [06-DECISION_FRAMEWORK.md](./06-DECISION_FRAMEWORK.md) + [01-CONSTITUTION.md](./01-CONSTITUTION.md) |
| Onboarding changes | [01-CONSTITUTION.md](./01-CONSTITUTION.md) Article V + [03-PRODUCT_OPERATING_SYSTEM.md](./03-PRODUCT_OPERATING_SYSTEM.md) |
| AI behavior, prompts, outputs | [05-AI_PRINCIPLES.md](./05-AI_PRINCIPLES.md) + [01-CONSTITUTION.md](./01-CONSTITUTION.md) Article IV |
| UI/UX design | [04-DESIGN_PRINCIPLES.md](./04-DESIGN_PRINCIPLES.md) |
| Terminology in copy or code | [07-GLOSSARY.md](./07-GLOSSARY.md) |
| Product vision and roadmap | [02-PRODUCT-BIBLE.md](./02-PRODUCT-BIBLE.md) |
| Constitutional disputes | [01-CONSTITUTION.md](./01-CONSTITUTION.md) is the final authority |
| Amendment history | [08-CHANGELOG.md](./08-CHANGELOG.md) |

---

## Current Constitution Version

**v1.1.0** — amended July 17, 2026

| Article | Title | Status |
|---------|-------|--------|
| I | Mission | Founding |
| II | The Child | Founding |
| III | The Parent | Founding |
| IV | The Role of AI | Founding |
| V | The Family Journey Principle | Ratified July 17, 2026 |

---

## How to Amend the Constitution

1. Draft the proposed article or change against `01-CONSTITUTION.md`.
2. Reference which existing articles it extends, modifies, or supersedes.
3. Add a Pending entry to `08-CHANGELOG.md`.
4. Obtain agreement from product leadership.
5. Merge, update the Changelog entry to Ratified, and increment the Constitution version.
6. Update this README's version table.
7. Commit as `docs: ratify <Amendment Name>`.
