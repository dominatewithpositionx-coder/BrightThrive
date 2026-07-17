# BrytThrive Glossary

> **Status:** Active
> **Last updated:** July 17, 2026

This glossary defines the shared vocabulary of BrytThrive. All product, engineering, design, and AI documentation should use these terms consistently. If a term is used differently in two documents, this glossary is the authority.

---

## A

### Adventure
The child's personal journey through BrytThrive. The Adventure belongs to the child — it is shaped by their choices, their missions, and their discovered Superpowers. Parents create the environment; children create the Adventure.

---

## B

### BrytCoins
The recognition currency of BrytThrive. Earned by completing Missions (10 BrytCoins per Mission). Redeemed for family-defined Rewards with parent approval. BrytCoins represent effort that a parent has chosen to honor — they are not points in a game.

*Technical: managed by `bt_coin_wallet` (balance) and `bt_coin_ledger` (transaction history). Deductions require parent approval and pass through the `add_coins()` RPC with a balance lock.*

---

## C

### Child Guide
*(Reserved term — to be defined in a future product cycle.)*

The role or persona of the BrytThrive AI when speaking directly to a child. Encouraging, brief, identity-affirming.

---

## D

### Dashboard
The parent's primary view of their family's activity. Shows pending missions, completed missions, BrytCoin balances, recognition opportunities, and reward requests.

---

## E

### Explorer
A child using BrytThrive. The term reflects the child's relationship to the product — they are discovering their strengths, not being managed toward them.

---

## F

### Family Journey
The combined arc of a parent and child progressing together through BrytThrive over time. The Family Journey is the relationship, not the individual sessions.

*See also: [02-PRODUCT-BIBLE.md — Family Journey](./02-PRODUCT-BIBLE.md#family-journey)*

### Family Win
The atomic unit of BrytThrive's success metric. A Family Win occurs when:

1. A child completes a Mission.
2. A parent notices and recognizes that effort.
3. The child feels seen, proud, and motivated to return tomorrow.

*See: [01-CONSTITUTION.md — Article V](./01-CONSTITUTION.md#article-v--the-family-journey-principle)*

---

## G

### Growth Superpower
One of five identity frameworks that BrytThrive uses to help children discover their unique strengths. Superpowers are not assigned by questionnaire — they emerge through completed Missions and reflections over time.

| Superpower | Core Behavior |
|-----------|--------------|
| Boundary Builder | Knows and respects limits — their own and others' |
| Focus Finder | Can direct attention and follow through |
| Self Soother | Manages emotions and recovers from frustration |
| Autonomy Builder | Acts independently and takes initiative |
| Team Player | Collaborates, shares, and thinks of others |

*Technical: stored as `identity_tag` on the `missions` table. Values: `boundary_builder`, `focus_finder`, `self_soother`, `autonomy_builder`, `team_player`.*

---

## J

### Journey
See *Family Journey* and *Adventure*. "Journey" without qualification refers to the Family Journey.

---

## M

### Mission
A short, actionable, age-appropriate growth task suggested by BrytThrive AI for a specific child. Missions are completable in under 10 minutes, written for the child to read, and tagged with a Growth Superpower identity.

*Technical: stored in the `missions` table.*

---

## N

### Nova
BrytThrive's internal name for the AI coach persona. Used in UI copy when attributing mission generation or suggestions to the AI. Nova's voice is warm, brief, and process-focused.

---

## P

### Parent Coach
*(Reserved term — to be defined in a future product cycle.)*

The role or persona of the BrytThrive AI when supporting a parent. Informative, encouraging, never judgmental.

---

## Q

### Quest
*(Reserved term — future use.)*

A multi-mission sequence tied to a specific growth goal or Superpower arc. Not yet implemented.

---

## R

### Recognition
A parent's specific, encouraging acknowledgment of a child's completed Mission. Recognition can be a message, a BrytCoin award, or both. The parent's voice is the product — AI provides suggestions; the parent provides the recognition.

### Reward
A family-defined incentive that a child can request using BrytCoins. Rewards require parent approval before BrytCoins are deducted. Created by parents in the Dashboard.

*Technical: stored in the `rewards` table. Redemption requests stored in `reward_redemptions`.*

---

## S

### Superpower
Shorthand for *Growth Superpower*.

---

## T

*(No terms currently defined under T.)*

---

*To add a term: open a pull request with the new entry in alphabetical order and record the change in [08-CHANGELOG.md](./08-CHANGELOG.md).*
