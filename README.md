# Primal Vote

A community-driven creature evolution game built on Reddit with [Devvit](https://developers.reddit.com/).

The subreddit becomes the hive mind. Every day, voters collectively choose one mutation for their shared creature. Over 30 days the creature evolves, faces environmental crises, and builds scars that persist across generations.

## How to Play

1. Open the game post in your subreddit.
2. Each day a new vote presents two mutation options — pick the one you think best prepares the creature for what's coming.
3. The winning mutation is applied at midnight UTC and the creature's stats shift accordingly.
4. When an environmental event arrives, the community's collective stat choices determine whether the creature survives, partially survives, or is devastated.
5. After 30 days the generation ends and a new creature inherits the legacy (battle scars and lore carry forward).

## Stat System

Six stats shape the creature's capabilities:

| Stat | Governs |
|---|---|
| Heat | Fire & temperature resistance |
| Cold | Ice & freezing resistance |
| Speed | Evasion & time-pressure events |
| Armor | Physical damage reduction |
| Mind | Cognitive & plague resistance |
| Aqua | Water & flood resistance |

## Crisis Types

Environmental events beyond Tier 1 trigger a crisis window where the community must act:

**Time Pressure** — A short window (8 hours) to vote flee or fight. Speed and armor matter most. Used by: Büyük Meteor.

**Participation** — The community must reach a vote threshold within the window. Failure means the creature faces the event alone. Used by: Kıtlık, Buzul Çağı.

**Faction** — Voters split into flee vs. fight factions. Thresholds determine which side wins and the outcome (win / partial / devastated). Used by: Predatör İstilası, Kozmik Hastalık.

**Chain** — The creature must pass a stat check on consecutive days. Failing any day resets the chain. Used by: Büyük Sel, Volkan Patlaması.

## Battle Scars

When a Tier 2 or 3 crisis results in partial survival or devastation, the creature gains a permanent battle scar — a visual mark rendered as a sprite layer that carries through to future generations. Faction partial outcomes produce a faded variant of the scar.

## Tech Stack

- **Devvit Web** (0.13.x) — Reddit developer platform, server runtime, Redis, scheduler
- **React 19** — UI layer rendered inside a Reddit iFrame
- **Phaser 3** — 2D game rendering for the creature canvas
- **Redis** — Persistent game state (creature stats, votes, user streaks, generation records)
- **Hono** — Backend routing on the Devvit server

## Hackathon

Built for the Reddit Devvit Hackathon. The goal: prove that a persistent, community-shaped living creature can emerge from daily Reddit voting.

## Development

```bash
# Install dependencies
npm install

# Start dev server (requires Devvit login)
npm run dev

# Type check
npm run type-check

# Deploy
npm run deploy
```

Requires Node.js >= 22.2.0 and a Reddit account connected to [Reddit Developers](https://developers.reddit.com/).
