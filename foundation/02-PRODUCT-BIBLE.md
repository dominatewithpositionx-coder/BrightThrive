# BrytThrive Product Bible

> **Status:** Living document — updated with each major product release
> **Last updated:** July 17, 2026

The Product Bible is the living vision for BrytThrive. It describes what the product is, who it serves, why it exists, and where it is going. Unlike the [Constitution](./01-CONSTITUTION.md), which changes only through formal amendment, the Product Bible evolves continuously as the product matures.

---

## Table of Contents

1. [Mission](#mission)
2. [Vision](#vision)
3. [Product Philosophy](#product-philosophy)
4. [Personas](#personas)
5. [Parent Journey](#parent-journey)
6. [Child Journey](#child-journey)
7. [Family Journey](#family-journey)
8. [Family Wins](#family-wins)
9. [Growth Superpowers](#growth-superpowers)
10. [BrytCoins](#brytcoins)
11. [Mission System](#mission-system)
12. [Recognition System](#recognition-system)
13. [Rewards](#rewards)
14. [AI Coach](#ai-coach)
15. [Subscription Strategy](#subscription-strategy)
16. [Retention Loops](#retention-loops)
17. [Future Roadmap](#future-roadmap)

---

## Mission

BrytThrive's mission is to give every child the experience of being seen, celebrated, and motivated to grow — while giving every parent the tools to make that happen consistently and joyfully.

---

## Vision

A world where every family has a daily rhythm of growth, recognition, and shared pride — and where every child goes to bed knowing they did something that mattered.

---

## Product Philosophy

BrytThrive is not a task manager. It is not a chore chart. It is not a behavior modification tool.

BrytThrive is a family growth platform. It helps parents create the conditions for their children to discover their strengths, build ownership over their own behavior, and experience the pride of genuine accomplishment.

Three beliefs underpin everything:

**1. Children grow faster when they feel seen.**
Recognition from a parent — specific, timely, and genuine — is more powerful than any reward.

**2. Ownership is more durable than compliance.**
A child who chose to complete a mission because it felt meaningful will repeat that behavior. A child who completed it to avoid punishment will not.

**3. AI should personalize, not replace.**
The parent's voice is irreplaceable. AI's job is to make the parent's presence feel more consistent, more informed, and more encouraging — not to substitute for it.

---

## Personas

### The Motivated Parent

> "I want to be more intentional about recognizing my kids, but the day moves fast."

- Busy professional or caregiver with 1–3 children ages 5–14
- Genuinely wants to strengthen their relationship with their child
- Frustrated by reactive parenting — wants proactive tools
- Will engage daily if the app saves time and makes them feel like a good parent

### The Curious Child (ages 7–12)

> "I want to feel good at something and have my parents notice."

- Responds strongly to personalization and identity ("my superpower")
- Motivated by visible progress and earning recognition
- Loses interest in generic task lists quickly
- Wants their experience to feel like theirs, not a parent's assignment

### The Teen Explorer (ages 13–16)

> *(Placeholder — persona to be developed in future product cycle)*

---

## Parent Journey

| Stage | Experience |
|-------|-----------|
| Discovery | Hears about BrytThrive from a friend, social channel, or parenting community |
| Signup | Creates account, adds first child in under 2 minutes |
| First Mission | Child receives first AI-generated mission within 60 seconds of onboarding |
| First Recognition | Parent sends first recognition message to child |
| **First Family Win** | Child completes mission + parent notices = emotional hook |
| Habit Formation | Daily check-in becomes routine; parent feels more connected |
| Upgrade | Unlocks premium features as family grows into the platform |

---

## Child Journey

| Stage | Experience |
|-------|-----------|
| Introduction | Sees their personalized dashboard for the first time |
| First Mission | Receives first mission tailored to their identity tag |
| Completion | Marks mission complete; earns BrytCoins and parent recognition |
| Superpower Discovery | Reflects on which Growth Superpower they used |
| Growth Moment | Parent sends a specific, encouraging message |
| Identity Formation | Over time, child builds a picture of their unique strengths |

---

## Family Journey

The Family Journey is the combined arc of parent and child progressing together. BrytThrive measures family health through:

- **Streak** — consecutive days with at least one completed mission
- **Family Wins** — moments when a child completes + parent recognizes
- **Superpower Map** — the child's growing identity across Growth Superpowers
- **Recognition History** — a permanent record of parent encouragement

*(Full Family Journey architecture to be defined in a future product cycle.)*

---

## Family Wins

The Family Win is the atomic unit of BrytThrive's success metric.

A Family Win occurs when:

1. A child completes their first (or next) mission.
2. A parent notices and recognizes that effort.
3. The child feels seen, proud, and motivated to return tomorrow.

Every product feature should make Family Wins more frequent, more meaningful, or easier to achieve.

---

## Growth Superpowers

Growth Superpowers are BrytThrive's framework for helping children discover their unique strengths. Each child's missions are tagged with one of five Superpower identities:

| Superpower | What It Means |
|-----------|--------------|
| Boundary Builder | Knows and respects limits — their own and others' |
| Focus Finder | Can direct attention and follow through |
| Self Soother | Manages emotions and recovers from frustration |
| Autonomy Builder | Acts independently and takes initiative |
| Team Player | Collaborates, shares, and thinks of others |

Superpowers are not assigned by questionnaire. They emerge over time through completed missions and reflections. The AI tracks patterns and surfaces the child's emerging identity narrative.

---

## BrytCoins

BrytCoins are BrytThrive's recognition currency. They:

- Are earned by completing missions (10 BrytCoins per mission)
- Are redeemed for family-defined rewards
- Require parent approval for redemption
- Are deducted at approval time via the `add_coins()` RPC with a balance lock

BrytCoins are not a gamification layer. They are a tangible representation of effort that a parent has chosen to honor. The parent approval step is constitutional — it ensures the parent remains the source of recognition, not the app.

---

## Mission System

Missions are the daily growth actions BrytThrive suggests for each child.

- Generated by AI based on the child's identity tag and current Superpower
- Delivered as short, actionable, age-appropriate tasks
- Completable in under 10 minutes
- Reflective — the child considers which Superpower they used after completing

Mission design rules:
- One clear action per mission
- Written for the child to read, not the parent
- Encouraging in tone — never punitive
- Connected to the child's identity, not generic chores

---

## Recognition System

The Recognition System allows parents to send specific, encouraging messages to their children when a mission is completed.

- Parent selects from AI-suggested templates or writes their own
- Message is tied to a specific mission and Superpower
- Child sees the message in their dashboard
- Message is stored as part of the child's growth history

The parent's voice is the product. AI provides suggestions; the parent provides the recognition.

---

## Rewards

Rewards are family-defined incentives that children can request using BrytCoins.

- Parents create rewards with a BrytCoin cost
- Children request redemption
- Parent approves or declines
- Approval triggers coin deduction via guarded RPC

Rewards reinforce the parent-as-partner model. They are not arbitrary prizes — they are commitments the parent has made to honor the child's effort.

---

## AI Coach

*(Architecture placeholder — to be defined in a future product cycle.)*

The AI Coach is BrytThrive's long-term personalization layer. Its responsibilities include:

- Generating age-appropriate, identity-tagged missions
- Suggesting recognition language to parents
- Tracking Superpower emergence over time
- Adapting mission difficulty and tone based on child behavior
- Never diagnosing, shaming, or making clinical assessments

The AI Coach follows the [AI Principles](./05-AI_PRINCIPLES.md) without exception.

---

## Subscription Strategy

*(Placeholder — to be developed with business strategy team.)*

- Free tier: limited missions per day, single child
- Premium tier: unlimited missions, multiple children, full recognition history, advanced AI personalization
- Family plan: multiple children, shared Family Journey view

---

## Retention Loops

BrytThrive's primary retention mechanism is the Family Win loop:

```
Child sees mission → completes mission → earns BrytCoins →
parent recognizes → child feels seen → returns tomorrow
```

Secondary retention mechanisms:
- Streak maintenance
- Superpower discovery arc
- Reward anticipation
- Parent habit of daily check-in

*(Full retention modeling to be developed with growth team.)*

---

## Future Roadmap

*(Placeholder — to be maintained by product team.)*

| Priority | Feature | Status |
|----------|---------|--------|
| P0 | Family Win #1 — Core loop | Shipped |
| P1 | Multi-child support | Planned |
| P2 | Family Journey view | Planned |
| P3 | AI Coach v1 | Planned |
| P4 | Teen Explorer persona | Research |
| P5 | Family milestone celebrations | Research |

*Specific implementation details belong in engineering tickets, not this document.*
