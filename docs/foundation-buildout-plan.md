## Plan: BC5 Tournament Foundation Buildout

Build the next iteration around a tournament-year-first domain: admin creates season, defines teams/divisions, assigns yearly roster memberships, then publishes lane draw match slots (team or singles) that become the canonical input for live scoring and standings. This keeps your current Express + Sequelize setup, reuses existing tournament endpoints, and avoids premature full-workbook import complexity.

**Steps**

1. Phase 1 - Solidify domain and constraints (blocks all later phases).
2. Update Sequelize models in ~/workspace/bc5-open-stats/server/database.js to support yearly roster assignment as source of truth (zone stored on yearly assignment, not only master bowler profile).
3. Add relational structure for team membership per tournament/division/year with uniqueness rules: one team per bowler per division per tournament year, while still allowing same bowler in multiple divisions.
4. Add lane draw scheduling entities for per-match-slot scheduling: tournamentYearId, division, eventType (team|singles), block/round identifiers, lane, sideA, sideB, optional scheduled datetime, status (draft|published).
5. Add database-level indexes/constraints for duplicate prevention and fast lookups (tournamentYearId+division+lane+block uniqueness; roster uniqueness by bowler/division/year).
6. Phase 2 - Admin API completion (depends on Phase 1).
7. Expand ~/workspace/bc5-open-stats/server/routes/tournamentSetup.js into resource-oriented admin endpoints: create/update tournaments, teams, bowlers, yearly roster assignments, and lane draw slots; add list endpoints filtered by tournament year/division.
8. Add validation and idempotent upsert behavior for roster and draw bulk entry so admin can correct mistakes safely.
9. Restrict all admin mutations behind existing session gate pattern in ~/workspace/bc5-open-stats/server/index.js (reuse requireAdmin behavior as middleware for write routes).
10. Add admin read endpoint that returns one hydration payload per tournament: teams + roster assignments + draw slots, to reduce frontend round trips.
11. Phase 3 - Admin UI workflow (depends on Phase 2; some UI substeps parallel).
12. Keep ~/workspace/bc5-open-stats/admin/index.html and ~/workspace/bc5-open-stats/admin/script.js as the first complete admin workflow before React migration.
13. Implement 3 guided panels in admin UI: (a) tournament shell creation, (b) team + roster assignment by division, (c) lane draw slot editor with event type and side A/B selector.
14. Add guardrails in UI: duplicate assignment warnings, missing team references, and publish/unpublish toggle for draw schedule.
15. In parallel after plain admin works, wire the React placeholder in ~/workspace/bc5-open-stats/src/components/domain/admin/TournamentSetupPanel.tsx to display tournament setup status and deep-link actions.
16. Phase 4 - Scoring and immediate standings from schedule (depends on Phase 3 draw publication).
17. Replace free-form score entry in ~/workspace/bc5-open-stats/src/app.tsx with schedule-driven entry: score records bind to a draw slot and competitor side.
18. Evolve standings logic currently in calculateStandings in ~/workspace/bc5-open-stats/server/index.js to compute by tournament/division/event using persisted schedule + score results, not ad-hoc player/team strings.
19. Add SSE payload enrichment in existing /events flow so spectators receive targeted updates by tournament/division and can render immediate standings without full refresh.
20. Phase 5 - Workbook parity bridge (parallel with late Phase 4 once schema stabilizes).
21. Add a new importer script in ~/workspace/bc5-open-stats/data that maps CODES and ShortDraw workbook structures into the normalized DB schema (manual entry remains source for v1, import is backfill/acceleration).
22. Keep ~/workspace/bc5-open-stats/data/workbook_summary.json and ~/workspace/bc5-open-stats/data/workbook_model.md as reference docs only; do not derive standings from workbook formulas in runtime.
23. Add reconciliation report outputs (counts of teams, bowlers, draw slots) to validate imported data against workbook expectations before enabling import in production.

**Relevant files**

- ~/workspace/bc5-open-stats/server/database.js - extend TournamentYear, Team, TournamentBowler and add schedule-related models plus constraints/indexes.
- ~/workspace/bc5-open-stats/server/routes/tournamentSetup.js - convert current create-only endpoints into full admin CRUD + bulk upsert + hydration endpoint.
- ~/workspace/bc5-open-stats/server/index.js - mount/guard admin mutation routes, evolve calculateStandings integration path, and keep SSE update mechanism.
- ~/workspace/bc5-open-stats/admin/index.html - add multi-step admin setup UI sections.
- ~/workspace/bc5-open-stats/admin/script.js - implement fetch flows for teams/roster/draw and publish workflow.
- ~/workspace/bc5-open-stats/src/components/domain/admin/TournamentSetupPanel.tsx - replace placeholder text with setup progress summary and admin shortcuts.
- ~/workspace/bc5-open-stats/src/app.tsx - transition from free-form manual score entry to draw-slot-driven scoring and standings display.
- ~/workspace/bc5-open-stats/data/analyze_workbook.py - extend with explicit ShortDraw extraction logic for later parity migration.
- ~/workspace/bc5-open-stats/data/workbook_summary.json - source reference proving ShortDraw contains MEN'S/LADIES'/MIXED team event and singles lane structures.
- ~/workspace/bc5-open-stats/data/workbook_model.md - existing inferred business rules to align migration.

**Verification**

1. Database verification: run schema sync and confirm unique constraints reject duplicate roster assignment (same bowler/division/year) and duplicate draw slot (same tournament/division/block/lane).
2. API verification: exercise tournament -> team -> roster -> draw create/list/update flow with HTTP client; confirm hydration endpoint returns fully joined setup payload.
3. Admin UX verification: create a new season from blank DB, assign at least one team per division, add bowlers, publish draw, refresh page, and verify state persists.
4. Standings integration verification: submit scores against draw slots and confirm standings update path uses schedule-linked identities, not free text fields.
5. Realtime verification: open two browser sessions (admin + spectator) and confirm SSE-driven standings updates appear without manual refresh.
6. Workbook bridge verification: run importer in dry-run mode against external workbook and compare entity counts/report output to expected ShortDraw/CODES totals.

**Decisions**

- Roster rule: one team per division per bowler per tournament year.
- Zone ownership: zone is yearly assignment metadata (not fixed forever on master bowler).
- Draw granularity: per match slot with lane + side A/B + event type.
- Delivery order: manual admin entry first; workbook import follows after normalized schema and admin workflows are stable.
- In scope now: tournament creation, yearly team/roster assignment, lane draw setup and publication.
- Out of scope for this first implementation pass: full awards/stepladder/allstar parity and advanced workbook formula replication.

**Further Considerations**

1. Keep admin as server-rendered HTML/JS until workflows are stable, then migrate to React component-by-component to reduce churn.
2. Add lightweight audit columns (createdBy/updatedBy) during schema expansion so corrections to roster/draw are traceable.
3. Treat standings as derived projections (recomputable) rather than manually editable records to avoid drift from source scores.
