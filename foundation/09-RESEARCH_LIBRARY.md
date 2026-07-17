# BrytThrive Research Library

> **Status:** Active — continuously updated
> **Last updated:** July 17, 2026
> **Governed by:** [Article VI — Evidence Before Opinion](./01-CONSTITUTION.md#article-vi--evidence-before-opinion)

---

## 1. Purpose

The Research Library is BrytThrive's permanent institutional evidence repository.

Every important product decision should eventually reference one or more Research Library entries. This library becomes the institutional memory of BrytThrive — ensuring that decisions are not repeated from scratch, that insights accumulate over time, and that the product improves through learning rather than assumption.

When a feature proposal cites "evidence," that evidence belongs here. When a principle in the [Constitution](./01-CONSTITUTION.md) was informed by research, that research belongs here.

---

## 2. How to Use the Research Library

**When proposing a feature:**
Cite any relevant Research Library entries in your [Decision Framework](./06-DECISION_FRAMEWORK.md) scorecard. If no entries exist for your topic, add an item to the [Research Backlog](#7-research-backlog).

**When completing research:**
Add a new entry using the [Entry Template](#5-research-entry-template). Update the [Evidence Index](#6-evidence-index) with the entry title, date, category, and confidence rating.

**When making a product decision without evidence:**
Document the assumption explicitly in the Evidence Index as a hypothesis entry. Identify the pilot that would validate or invalidate it. Record the outcome when data is available.

**When evidence conflicts with a current product decision:**
Surface the conflict to product leadership. Reference [Article VI](./01-CONSTITUTION.md#article-vi--evidence-before-opinion): when evidence conflicts with opinion, BrytThrive follows the evidence.

---

## 3. Evidence Standards

Every Research Library entry carries a confidence rating based on the quality and reproducibility of its source.

| Rating | Level | Definition |
|--------|-------|-----------|
| ★★★★★ | Strong evidence | Peer-reviewed research, replicated studies, or large-scale controlled experiments with statistically significant results directly applicable to BrytThrive's context |
| ★★★★☆ | Good evidence | Credible expert sources, well-documented case studies, or BrytThrive pilot results with meaningful sample sizes |
| ★★★☆☆ | Moderate evidence | Qualitative interviews (5+ participants), reputable industry reports, or smaller internal experiments with directional but not conclusive results |
| ★★☆☆☆ | Weak evidence | Single interviews, anecdotal observations, or expert opinion without supporting data |
| ★☆☆☆☆ | Idea only | Unvalidated hypothesis or internal intuition — must be piloted before informing a product decision |

When citing evidence in a feature proposal, always include the confidence rating. A proposal built entirely on ★☆☆☆☆ entries requires a pilot plan before advancing.

---

## 4. Evidence Categories

Research Library entries are tagged with one or more of the following categories:

| Category | Description |
|---------|-------------|
| **Parent Interviews** | Qualitative sessions with BrytThrive parents or target-persona parents |
| **Child Interviews** | Qualitative sessions with children in BrytThrive's target age range |
| **Parent Coaching Institute** | Insights from professional parent coaching research or practitioners |
| **Scientific Literature** | Peer-reviewed academic research in child development, motivation, behavioral science, or related fields |
| **Books** | Key insights from books on child development, habit formation, motivation, or family dynamics |
| **Podcasts** | Relevant expert commentary from credible podcasts in parenting, education, or behavioral science |
| **Internal Analytics** | Quantitative data from BrytThrive's own product instrumentation |
| **User Testing** | Structured usability sessions with parents or children using BrytThrive |
| **A/B Tests** | Controlled experiments run inside BrytThrive comparing two or more variants |
| **Pilot Families** | Structured early-access programs with a defined cohort of families |
| **Product Experiments** | Uncontrolled but intentional product changes tracked for outcome |
| **Expert Interviews** | Conversations with researchers, clinicians, educators, or other domain experts |
| **Competitive Analysis** | Observations about how other family, education, or habit products solve similar problems |
| **Feature Validation** | Pre-ship validation of a specific BrytThrive feature with target users |
| **AI Observations** | Patterns observed in AI-generated content quality, child engagement with missions, or personalization effectiveness |

---

## 5. Research Entry Template

Every new entry must follow this format. Copy the template, fill in all fields, and add the entry to the [Evidence Index](#6-evidence-index).

```markdown
## [Entry Title]

| Field | Value |
|-------|-------|
| **Date** | YYYY-MM-DD |
| **Source** | [Publication / Organization / Platform] |
| **Author** | [Name(s) or "BrytThrive Internal"] |
| **Evidence Category** | [Category from Section 4] |
| **Confidence Rating** | ★☆☆☆☆ to ★★★★★ |

### Summary
[2–4 sentences describing the source and what was studied or observed.]

### Key Insights
- [Specific, actionable insight]
- [Specific, actionable insight]
- [Specific, actionable insight]

### Product Implications
[How does this evidence affect BrytThrive's product decisions? Be specific about which features, flows, or principles are affected.]

### Affected Features
- [Feature or system name]
- [Feature or system name]

### Constitutional Principles Referenced
- [e.g., Article V — The Family Journey Principle]
- [e.g., Article VI — Evidence Before Opinion]

### Open Questions
- [What does this evidence leave unanswered?]
- [What would need to be true for this to apply differently?]

### Recommended Next Action
[What should BrytThrive do with this evidence? Research more? Run a pilot? Update a feature? Ratify a principle?]

### Related Entries
- [Title of related entry, if any]

### Status
[ ] Active — informing current decisions
[ ] Superseded — replaced by stronger evidence (link to new entry)
[ ] Archived — no longer relevant to current product
```

---

## 6. Evidence Index

*No entries yet. The first entries will be added as research is conducted and documented.*

| # | Title | Date | Category | Confidence | Status |
|---|-------|------|----------|-----------|--------|
| — | *(pending)* | — | — | — | — |

---

## 7. Research Backlog

Questions BrytThrive still needs to answer. Each backlog item represents a gap in our evidence base. As items are answered, they are moved to the Evidence Index as complete entries.

### Child Motivation

- What creates long-term intrinsic motivation in children aged 7–12?
- What is the relationship between parental recognition and a child's willingness to repeat a behavior?
- How does a child's sense of identity ("I am a Focus Finder") affect their persistence on difficult tasks?
- At what age do children begin internalizing identity labels? What risks exist?

### Mission Design

- How frequently should missions refresh to maintain novelty without causing confusion?
- What mission length (time to complete) produces the highest completion rate?
- What types of missions generate the most meaningful parent recognition moments?
- How should mission difficulty scale as a child grows in a Superpower?

### Recognition and Praise

- What makes praise most effective? (specificity, timing, source, type)
- How does process praise compare to outcome praise in long-term behavior change?
- What is the optimal delay between mission completion and parent recognition?
- Does AI-suggested recognition language feel authentic to parents, or does it feel scripted?

### Retention

- What predicts Day-7, Day-14, and Day-30 retention in family habit apps?
- What causes parents to cancel subscriptions to parenting or children's apps?
- What is the relationship between Family Win frequency and long-term retention?
- What role does streak mechanics play in family app retention, and what are the risks?

### Onboarding

- What is the minimum viable onboarding that produces a Family Win within the first session?
- What onboarding fields, if removed, would not reduce AI personalization quality?
- How do families describe their experience of "getting started" with BrytThrive?

### Multi-Child Families

- How do parents manage attention and recognition across multiple children?
- What are the risks of sibling comparison in digital habit apps?
- How does a second child's onboarding differ from a first child's?

### AI Personalization

- How quickly can meaningful personalization occur from observed behavior alone?
- What signals most reliably predict a child's Superpower emergence?
- How do children respond when an AI recommendation feels wrong or off-target?
