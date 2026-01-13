# Parser System

The parser is a background service that periodically reads Stellaris save files, extracts game state data, and stores it in PostgreSQL for analysis via the GraphQL API.

## Parser Architecture

### Execution Model

- **Interval-Based**: Runs on a configurable interval defined by `STELLARIS_STATS_PARSER_INTERVAL` environment variable
- **Watch Mode**: Uses `tsx watch` for automatic restart on code changes during development
- **Command**: `npm run parser:run -- -g <gamestateId>` or `npm run parser:run -- -l` to list available saves

### Key Components

**Configuration (`src/parser/parserConfig.ts`)**

- Defines parser-specific configuration schema
- Validates `STELLARIS_STATS_PARSER_INTERVAL` using Zod

**Main Parser (`src/parser/parserMain.ts`)**

- Orchestrates the parsing workflow
- Runs database migrations on startup
- Executes parsing loop at configured intervals
- Handles graceful shutdown (SIGTERM, SIGINT)

**Gamestate Reader (`src/parser/gamestateReader.ts`)**

- Extracts `gamestate` file from ZIP-compressed save files using yauzl-promise
- Returns gamestate data as `Uint8Array` for parsing

**Parser Options (`src/parser/parserOptions.ts`)**

- Parses command-line arguments using Commander
- Supports `-g <gamestateId>` to specify which save to parse
- Supports `-l` to list available gamestate IDs from `/stellaris-data` directory

## Parsing Workflow

1. **Read Save File**: Extract gamestate from ZIP file at `/stellaris-data/<gamestateId>/ironman.sav`
2. **Parse with Jomini**: Convert Paradox Clausewitz format to JavaScript object
3. **Extract Metadata**: Parse `name` (empire name) and `date` (in-game date) from gamestate
4. **Begin Transaction**: Use `withTx()` helper to wrap all database operations in a transaction
5. **Upsert Save**: Create or update save row with filename (without .sav extension) and name
6. **Check Existence**: Query database for existing gamestate in the same month using `startOfMonth()` comparison
7. **Insert Gamestate**: If no gamestate exists for that month, insert new row with full parsed JSON as JSONB
8. **Populate Budget Tables**: Extract budget data from parsed object and insert into `budget_entry` and `budget_category` tables
9. **Commit Transaction**: Transaction automatically commits on success, rolls back on error

## Budget Table Population

**Budget Data Extraction:**

- Player country ID: `parsed.player[0].country`
- Budget data path: `parsed.country[playerCountryId].budget.current_month`
- Structure: Three-level nested object with category types (`income`, `expenses`, `balance`), each containing category names (e.g., `country_base`, `armies`, `ships`), which contain resource fields (20 total: `energy`, `minerals`, `alloys`, etc.)

**Database Functions:**

- `populateBudgetTables(client, gamestateId, parsed, logger)` - Main orchestration function in `src/parser/budgetPopulator.ts`
- `insertBudgetEntry(client, entryData)` - Internal function that inserts budget_entry row with 20 resource columns, returns budget_entry_id
- `insertBudgetCategory(client, gamestateId, categoryType, categoryName, budgetEntryId)` - Internal function that links budget entry to gamestate

**Transaction Atomicity:**

- All parser operations (save upsert, gamestate insert, budget population) wrapped in single transaction using `withTx()` helper
- Ensures budget data is never orphaned from its gamestate
- If budget population fails unexpectedly, entire operation rolls back

**Graceful Error Handling:**

- Missing player country ID: Log warning, skip budget population
- Missing budget data: Log info, skip budget population (normal for some saves)
- Validation errors: Log error with context, skip budget population
- Unexpected errors: Transaction rolls back, error bubbles up
- Budget population is non-critical and won't fail parser iteration for missing/invalid data

## Database Operations

**Save Management**

- Functions: `getSave(client, filename)` and `insertSave(client, filename, name)` in `src/db/save.ts`
- Parser checks for existing save first with `getSave`, only inserts if not found
- Simple insert pattern rather than upsert

**Gamestate Existence Check**

- Function: `getGamestateByMonth(client, saveId, date)` in `src/db/gamestates.ts`
- Uses PostgreSQL `DATE_TRUNC('month', ...)` to compare dates by month
- Applies `startOfMonth()` (from date-fns) to incoming date only, not database date
- Example: File date `2200-04-18` matches database date `2200-04-01`
- Returns existing gamestate if found, undefined otherwise

**Gamestate Insertion**

- Function: `insertGamestate(client, saveId, date, data)` in `src/db/gamestates.ts`
- Inserts full parsed gamestate as JSONB into `data` column
- Enforces uniqueness constraint on `(save_id, date)` pair
- Returns inserted gamestate with `gamestateId` and `date`

## Error Handling

- Try-catch wrapper around each parser iteration
- Errors logged with full context using Pino logger
- Failed iterations don't crash the parser - next iteration runs normally
- Database client properly released even on errors (try-finally pattern)

## Configuration

**Environment Variables:**

- `STELLARIS_STATS_PARSER_INTERVAL` - Milliseconds between parser iterations

**Data Location:**

- Save files stored at `/stellaris-data/<gamestateId>/ironman.sav`
- Each gamestate ID is a directory containing the save file

## Database Schema

**Save Table:**

```sql
CREATE TABLE save (
  save_id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL
)
```

**Gamestate Table:**

```sql
CREATE TABLE gamestate (
  gamestate_id SERIAL PRIMARY KEY,
  save_id INTEGER NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  data JSONB NOT NULL,
  UNIQUE (save_id, date),
  FOREIGN KEY (save_id) REFERENCES save (save_id) ON DELETE CASCADE
)
```
