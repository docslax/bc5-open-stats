# BC5Pin workbook data model proposal

## What the spreadsheet contains

The current workbook is not a simple one-table export. It is organized as multiple event-specific sheets:

- CODES: bowler lookup metadata (name, zone, grouping, event label)
- MensPoints / LadiesPoints / MixedPoints: ranking summaries for the team/points event
- MensLadder1..MensLadder3 / LadiesLadder1..LadiesLadder3 / MixedLadder1..MixedLadder3: zone ladder/standings views
- Mens1..Mens8 / Ladies1..Ladies8 / Mixed1..Mixed8: detailed game-by-game standing tables per zone
- MensIndStats / Ladies IndStats / MixedIndStats: individual player statistics

## Core business entities inferred from the workbook

1. Bowler
   - id: structured numeric identifier from the CODES sheet
     - first digit = zone (1, 2, 3, 4, 5, 8)
     - second digit = team family (2 = Mens, 3 = Ladies, 4 = Mixed)
     - last digit = position qualifier (0 = coach, 1-6 = qualifying placement)
   - name
   - zone
   - grouping (coach/team/etc.)
   - roster is yearly-specific, so the app must treat this as a dynamic lookup rather than a hard-coded list

2. Event / Category
   - mens / ladies / mixed
   - team event vs singles/stepladder/awards

3. Game record
   - week or game number (1..15 in the detailed sheets)
   - pinfall value
   - frames played
   - points earned for that game

4. Standing row
   - bowler identity
   - total pinfall
   - average
   - high scores (single / triple / four / five)
   - 300 games and 400 games counts
   - total points won
   - rank

5. Zone / ladder context
   - each ladder sheet is a zone-specific leaderboard
   - zone names are embedded in the sheet itself (Zone 1, Zone 2, etc.)

## Business rules to implement in the app

- Each bowler belongs to one category (Mens, Ladies, Mixed) and one zone, derived from the identifier structure above.
- A standings record is derived from a series of game scores, not from a single manual score entry.
- Ranking should be based on total pinfall / average / points as currently calculated in the workbook formulas.
- The app should preserve the existing sheet-based event structure, but expose it through a simpler normalized model.
- The first MVP should support:
  - score input by bowler + zone + category + game values
  - standings recalculation
  - results pages for public view
  - import from the workbook later without breaking the schema

## Recommended normalized schema for the app

```json
{
  "bowlerId": 121,
  "zone": 1,
  "categoryCode": 2,
  "category": "Mens",
  "qualifier": 1,
  "isCoach": false,
  "name": "Shawn Eby",
  "zone": "Zone 1",
  "category": "Mens",
  "eventType": "Team",
  "games": [255, 280, 393, 266, 266, 301, 237, 214, 169, 288, 341, 293, 97, 240, 237],
  "frames": [10, 10, 10, 10, 10, 10, 10, 10, 8, 10, 10, 10, 6, 10, 10],
  "totalPinfall": 0,
  "average": 0,
  "pointsWon": 0,
  "highSingle": 0,
  "highTriple": 0,
  "highFour": 0,
  "highFive": 0,
  "threeHundredGames": 0,
  "fourHundredGames": 0,
  "rank": 0
}
```

## Next implementation step

The next coding step is to convert the workbook’s sheet layout into this normalized JSON model and compute standings from the imported rows, rather than from temporary sample data.
