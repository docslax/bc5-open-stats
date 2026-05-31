# BC5 Open Stats Exploration Summary

**Date:** May 29, 2026  
**Goal:** Migration from Excel workbook-based tournament tracking to full online system

## Key Findings

### Current Architecture

- **Frontend:** React 19 + TypeScript + MUI
- **Backend:** Express.js + Sequelize SQLite ORM
- **Database:** bc5-stats.sqlite with models: TournamentYear, Location, Bowler, TournamentBowler, Team, Standing, User
- **Auth:** Session-based (httpOnly cookie tokens)

### Models Implemented

- TournamentYear, Location, Team, Bowler, TournamentBowler, Standing, User
- All relationships defined in server/database.js

### Routes Implemented

- GET/POST /api/tournaments
- POST /api/tournaments/:id/teams
- POST /api/tournaments/:id/roster
- POST/GET /api/entries (basic score entry)
- GET /api/standings

### Critical Missing Models for Lane Draw Feature

1. GameType (enum: team, singles, stepladder)
2. LaneAssignment (tournamentYearId, zone, gameType, bowlerId, laneNumber, startTime)
3. Matchup (pairing logic, scoring)
4. DrawSchedule (event date, location, rounds)

### Data Model Gaps

- No team-bowler direct assignment (TournamentBowler lacks teamId)
- No bowler search API (rely on bowlerId lookup)
- No persistent game schedule (only ad-hoc weekly score entry)
- No bracket/pairing logic

### Frontend Gaps

- Admin console is vanilla JS (admin/script.js), not React
- TournamentSetupPanel is a placeholder
- No UI for lane draws or matchups

### Migration Artifacts

- **external/2026BCStats final (2).xlsx** — Production workbook, trustworthy, 50+ sheets
  - ShortDraw sheet contains lane layouts
  - Bowler IDs follow: zone(1) + category(1, 2=M/3=F/4=X) + qualifier(1)
- **data/workbook_summary.json** — Auto-analyzed schema, medium trustworthiness (sparse preview)
- **data/workbook_model.md** — Domain expert schema proposal (standings-focused, incomplete for scheduling)
- **data/scores.json** — Ad-hoc sample data, low trustworthiness

### Recommended Roadmap (4 phases)

1. **Data Model** (1-2 sprints): GameType, LaneAssignment, Matchup, DrawSchedule models; fix bowler lookup
2. **Lane Draw Backend** (1-2 sprints): ShortDraw import, draw generation API
3. **Frontend UI** (1-2 sprints): React admin migration, lane draw UI, public results
4. **Integration** (1 sprint): Workbook sync, rotation logic, mobile responsiveness

## Key Files to Reference

- [server/database.js](server/database.js) — All model definitions
- [server/routes/tournamentSetup.js](server/routes/tournamentSetup.js) — Current APIs
- [server/index.js](server/index.js) — Server setup, auth, score endpoints
- [src/app.tsx](src/app.tsx) — Main React component
- [data/workbook_model.md](data/workbook_model.md) — Business entity definitions
- [data/analyze_workbook.py](data/analyze_workbook.py) — Bowler ID decoding logic
- [external/2026BCStats final (2).xlsx](external/2026BCStats final (2).xlsx) — Source workbook
