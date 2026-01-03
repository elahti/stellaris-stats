# Plan: Gamestate API Expansion

## Overview

Add diplomatic relations, empire information, and planet coordinates to the GraphQL API, following the same pattern as the budget data (dedicated database tables + dataloaders).

---

## Architecture Pattern (from Budget Implementation)

```
┌─────────────────────┐
│ Gamestate JSON      │
│ (JSONB in gamestate)│
└─────────┬───────────┘
          │ Parser extracts data
          ▼
┌─────────────────────┐
│ Populator           │ (e.g., budgetPopulator.ts)
│ - Validates with Zod│
│ - Inserts to tables │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Database Tables     │ (e.g., budget_entry, budget_category)
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ DB Query Functions  │ (e.g., src/db/budget.ts)
│ - getBudgetBatch()  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ DataLoader          │ (e.g., budgetLoader.ts)
│ - Batch loading     │
│ - Caching           │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ GraphQL Resolver    │ (e.g., Gamestate.ts)
│ - Redis caching     │
│ - Returns typed data│
└─────────────────────┘
```

---

## New Data Structures

### 1. Empires (Basic Info)

Store basic empire information for all empires in the gamestate.

**Source**: `country.json` entries

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| countryId | string | Empire ID |
| name | string | Display name (extracted from localization format) |
| isPlayer | boolean | Whether this is the player's empire |
| capitalPlanetId | number | Planet ID of capital |
| ownedPlanetCount | number | Count of directly owned planets |
| controlledPlanetCount | number | Count of all controlled planets |
| militaryPower | number | Fleet military power |
| economyPower | number | Economy power rating |
| techPower | number | Technology power rating |

### 2. Diplomatic Relations

Store empire-to-empire diplomatic relations.

**Source**: `country.json[id].relationsManager.relation[]`

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| sourceCountryId | string | Source empire (always player) |
| targetCountryId | string | Target empire |
| opinion | number | Current opinion (-1000 to +1000) |
| trust | number | Trust level |
| threat | number | Perceived threat |
| isHostile | boolean | Currently at war |
| borderRange | number | Border proximity |
| hasContact | boolean | Has made contact |
| hasCommunications | boolean | Has communications |

### 3. Planet Coordinates

Extend planet data with coordinates.

**Source**: `planets.json.planet[id].coordinate`

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| x | float | Galactic X coordinate |
| y | float | Galactic Y coordinate |
| systemId | number | Origin system (galacticObject ID) |

---

## Implementation Steps

### Phase 1: Database Tables

#### Migration: `XXXXXXX_create-empire.sql`

```sql
CREATE TABLE empire (
  empire_id SERIAL PRIMARY KEY,
  gamestate_id INTEGER NOT NULL,
  country_id TEXT NOT NULL,
  name TEXT NOT NULL,
  is_player BOOLEAN NOT NULL DEFAULT FALSE,
  capital_planet_id INTEGER,
  owned_planet_count INTEGER NOT NULL DEFAULT 0,
  controlled_planet_count INTEGER NOT NULL DEFAULT 0,
  military_power DOUBLE PRECISION,
  economy_power DOUBLE PRECISION,
  tech_power DOUBLE PRECISION,
  UNIQUE (gamestate_id, country_id),
  FOREIGN KEY (gamestate_id) REFERENCES gamestate (gamestate_id) ON DELETE CASCADE
);

CREATE INDEX idx_empire_gamestate ON empire(gamestate_id);
CREATE INDEX idx_empire_is_player ON empire(gamestate_id, is_player);
```

#### Migration: `XXXXXXX_create-diplomatic-relation.sql`

```sql
CREATE TABLE diplomatic_relation (
  diplomatic_relation_id SERIAL PRIMARY KEY,
  gamestate_id INTEGER NOT NULL,
  source_country_id TEXT NOT NULL,
  target_country_id TEXT NOT NULL,
  opinion INTEGER,
  trust INTEGER,
  threat INTEGER,
  is_hostile BOOLEAN NOT NULL DEFAULT FALSE,
  border_range INTEGER,
  has_contact BOOLEAN NOT NULL DEFAULT FALSE,
  has_communications BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (gamestate_id, source_country_id, target_country_id),
  FOREIGN KEY (gamestate_id) REFERENCES gamestate (gamestate_id) ON DELETE CASCADE
);

CREATE INDEX idx_diplomatic_relation_gamestate ON diplomatic_relation(gamestate_id);
CREATE INDEX idx_diplomatic_relation_source ON diplomatic_relation(gamestate_id, source_country_id);
```

#### Migration: `XXXXXXX_add-planet-coordinates.sql`

```sql
CREATE TABLE planet_coordinate (
  planet_coordinate_id SERIAL PRIMARY KEY,
  gamestate_id INTEGER NOT NULL,
  planet_id TEXT NOT NULL,
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL,
  system_id INTEGER,
  UNIQUE (gamestate_id, planet_id),
  FOREIGN KEY (gamestate_id) REFERENCES gamestate (gamestate_id) ON DELETE CASCADE
);

CREATE INDEX idx_planet_coordinate_gamestate ON planet_coordinate(gamestate_id);
```

---

### Phase 2: Parser/Populators

#### `src/parser/empirePopulator.ts`

- Extract all empires from `country` object
- Parse name from localization format (handle `%ADJECTIVE%` templates)
- Get player country ID from `player[0].country`
- Insert empire records

#### `src/parser/diplomaticRelationPopulator.ts`

- Extract player's `relationsManager.relation[]`
- Parse each relation object
- Insert diplomatic_relation records

#### `src/parser/planetCoordinatePopulator.ts`

- Extract all planets from `planets.planet`
- Get coordinate for each
- Insert planet_coordinate records

#### Update `src/parser/parserMain.ts`

Add calls to new populators after `populateBudgetTables`:

```typescript
await populateEmpireTables(client, gamestateId, gamestate, logger)
await populateDiplomaticRelationTables(client, gamestateId, gamestate, logger)
await populatePlanetCoordinateTables(client, gamestateId, gamestate, logger)
```

---

### Phase 3: Database Query Functions

#### `src/db/empire.ts`

```typescript
export const getEmpiresBatch = async (
  client: PoolClient,
  gamestateIds: readonly number[],
): Promise<Map<number, Empire[]>>

export const getPlayerEmpireBatch = async (
  client: PoolClient,
  gamestateIds: readonly number[],
): Promise<Map<number, Empire | null>>
```

#### `src/db/diplomaticRelation.ts`

```typescript
export const getDiplomaticRelationsBatch = async (
  client: PoolClient,
  gamestateIds: readonly number[],
): Promise<Map<number, DiplomaticRelation[]>>
```

#### `src/db/planetCoordinate.ts`

```typescript
export const getPlanetCoordinatesBatch = async (
  client: PoolClient,
  gamestateIds: readonly number[],
): Promise<Map<number, Map<string, PlanetCoordinate>>>
```

---

### Phase 4: GraphQL Schema

Update `graphql/schema.graphql`:

```graphql
type Empire @cacheControl {
  countryId: String!
  name: String!
  isPlayer: Boolean!
  capitalPlanetId: Int
  ownedPlanetCount: Int!
  controlledPlanetCount: Int!
  militaryPower: Float
  economyPower: Float
  techPower: Float
}

type DiplomaticRelation @cacheControl {
  targetCountryId: String!
  targetEmpireName: String
  opinion: Int
  trust: Int
  threat: Int
  isHostile: Boolean!
  borderRange: Int
  hasContact: Boolean!
  hasCommunications: Boolean!
}

type Coordinate @cacheControl {
  x: Float!
  y: Float!
  systemId: Int
}

# Update existing Planet type
type Planet @cacheControl {
  planetId: String!
  planetName: String!
  profits: PlanetProduction!
  coordinate: Coordinate  # NEW
}

# Update existing Gamestate type
type Gamestate @cacheControl {
  gamestateId: Int!
  date: DateTimeISO!
  planets: [Planet!]!
  budget: Budget!
  empires: [Empire!]!                      # NEW
  playerEmpire: Empire                     # NEW
  diplomaticRelations: [DiplomaticRelation!]!  # NEW
}
```

---

### Phase 5: DataLoaders

#### `src/graphql/dataloaders/empireLoader.ts`

```typescript
export const createEmpiresLoader = (client: PoolClient) =>
  new DataLoader<number, Empire[]>(...)

export const createPlayerEmpireLoader = (client: PoolClient) =>
  new DataLoader<number, Empire | null>(...)
```

#### `src/graphql/dataloaders/diplomaticRelationLoader.ts`

```typescript
export const createDiplomaticRelationsLoader = (client: PoolClient) =>
  new DataLoader<number, DiplomaticRelation[]>(...)
```

#### `src/graphql/dataloaders/planetCoordinateLoader.ts`

```typescript
export const createPlanetCoordinatesLoader = (client: PoolClient) =>
  new DataLoader<number, Map<string, PlanetCoordinate>>(...)
```

#### Update `src/graphql/dataloaders/index.ts`

Add new loaders to `createDataLoaders`.

---

### Phase 6: Resolvers

#### Update `src/graphql/generated/Gamestate.ts`

Add resolvers for `empires`, `playerEmpire`, `diplomaticRelations`.

#### Update `src/graphql/generated/Planet.ts`

Add resolver for `coordinate` field.

---

## File Changes Summary

### Source Files

| File | Action | Description |
|------|--------|-------------|
| `migrations/XXXXXXX_create-empire.sql` | Create | Empire table |
| `migrations/XXXXXXX_create-diplomatic-relation.sql` | Create | Diplomatic relations table |
| `migrations/XXXXXXX_add-planet-coordinates.sql` | Create | Planet coordinates table |
| `src/parser/empirePopulator.ts` | Create | Extract & insert empire data |
| `src/parser/diplomaticRelationPopulator.ts` | Create | Extract & insert relations |
| `src/parser/planetCoordinatePopulator.ts` | Create | Extract & insert coordinates |
| `src/parser/nameExtractor.ts` | Create | Name parsing utilities |
| `src/parser/parserMain.ts` | Modify | Call new populators |
| `src/db/empire.ts` | Create | Query empire data |
| `src/db/diplomaticRelation.ts` | Create | Query relations data |
| `src/db/planetCoordinate.ts` | Create | Query coordinates |
| `src/graphql/dataloaders/empireLoader.ts` | Create | Empire dataloader |
| `src/graphql/dataloaders/diplomaticRelationLoader.ts` | Create | Relations dataloader |
| `src/graphql/dataloaders/planetCoordinateLoader.ts` | Create | Coordinates dataloader |
| `src/graphql/dataloaders/index.ts` | Modify | Register new loaders |
| `graphql/schema.graphql` | Modify | Add new types and fields |
| `src/graphql/generated/Gamestate.ts` | Modify | Add new resolvers |
| `src/graphql/generated/Planet.ts` | Modify | Add coordinate resolver |

### Test Files

| File | Action | Description |
|------|--------|-------------|
| `tests/parser/empirePopulator.test.ts` | Create | Empire populator tests |
| `tests/parser/diplomaticRelationPopulator.test.ts` | Create | Relation populator tests |
| `tests/parser/planetCoordinatePopulator.test.ts` | Create | Coordinate populator tests |
| `tests/parser/nameExtractor.test.ts` | Create | Name extraction tests |
| `tests/db/empire.test.ts` | Create | Empire DB query tests |
| `tests/db/diplomaticRelation.test.ts` | Create | Relation DB query tests |
| `tests/db/planetCoordinate.test.ts` | Create | Coordinate DB query tests |
| `tests/graphql/dataloaders.test.ts` | Modify | Add new dataloader tests |
| `tests/saves.test.ts` | Modify | Add GraphQL integration tests |

### Test Fixtures

| File | Action | Description |
|------|--------|-------------|
| `tests/fixtures/db/empire-data.sql` | Create | Empire test data |
| `tests/fixtures/db/diplomatic-relation-data.sql` | Create | Relation test data |
| `tests/fixtures/db/planet-coordinate-data.sql` | Create | Coordinate test data |

---

## Example Queries After Implementation

### Get Player Empire with Relations

```graphql
query {
  save(filename: "mysave") {
    gamestates {
      date
      playerEmpire {
        name
        ownedPlanetCount
        militaryPower
      }
      diplomaticRelations {
        targetEmpireName
        opinion
        isHostile
        borderRange
      }
    }
  }
}
```

### Get All Empires

```graphql
query {
  save(filename: "mysave") {
    gamestates {
      date
      empires {
        countryId
        name
        isPlayer
        ownedPlanetCount
        militaryPower
      }
    }
  }
}
```

### Get Planets with Coordinates

```graphql
query {
  save(filename: "mysave") {
    gamestates {
      date
      planets {
        planetId
        planetName
        coordinate {
          x
          y
          systemId
        }
      }
    }
  }
}
```

---

## Considerations

### Data Volume

- **Empires**: ~20-100 per gamestate (manageable)
- **Diplomatic Relations**: ~50-200 per gamestate (manageable)
- **Planet Coordinates**: Could be 1000+ planets (consider lazy loading or filtering to player planets only)

### Name Extraction

Empire names use complex localization format. Need helper function:

```typescript
const extractDisplayName = (nameData: unknown): string => {
  // Handle simple: {key: "NAME_Something"}
  // Handle template: {key: "%ADJECTIVE%", variables: [...]}
  // Strip prefixes: EMPIRE_DESIGN_, NAME_, SPEC_
}
```

### Incremental Implementation

Can implement in phases:
1. Phase A: Empires only (most useful for basic queries)
2. Phase B: Diplomatic relations (enables neighbor analysis)
3. Phase C: Planet coordinates (enables spatial analysis)

---

## Testing Strategy

Following the existing test patterns in `tests/`, create comprehensive tests for each layer.

---

### Phase 7: Tests

#### 7.1 Parser/Populator Tests

##### `tests/parser/empirePopulator.test.ts`

```typescript
describe('Empire Populator', () => {
  describe('populateEmpireTables', () => {
    it('populates empire table from valid gamestate')
    it('handles string country id')
    it('handles numeric country id')
    it('correctly identifies player empire')
    it('extracts simple name format correctly')
    it('extracts template name format correctly')
    it('strips common name prefixes')
    it('counts owned planets correctly')
    it('counts controlled planets correctly')
    it('handles missing player country gracefully')
    it('handles missing country data gracefully')
    it('handles invalid gamestate schema gracefully')
    it('populates multiple empires')
    it('handles empire with no planets')
    it('extracts military/economy/tech power values')
  })
})
```

##### `tests/parser/diplomaticRelationPopulator.test.ts`

```typescript
describe('Diplomatic Relation Populator', () => {
  describe('populateDiplomaticRelationTables', () => {
    it('populates relations from valid gamestate')
    it('handles missing relationsManager gracefully')
    it('handles empty relations array')
    it('extracts all relation fields correctly')
    it('handles hostile relations')
    it('handles relations with missing optional fields')
    it('populates multiple relations')
    it('handles very negative opinion values')
    it('handles invalid gamestate schema gracefully')
  })
})
```

##### `tests/parser/planetCoordinatePopulator.test.ts`

```typescript
describe('Planet Coordinate Populator', () => {
  describe('populatePlanetCoordinateTables', () => {
    it('populates coordinates from valid gamestate')
    it('handles missing coordinate field gracefully')
    it('handles planets without origin system')
    it('populates multiple planet coordinates')
    it('handles negative coordinates')
    it('handles invalid gamestate schema gracefully')
  })
})
```

#### 7.2 Database Query Tests

##### `tests/db/empire.test.ts`

```typescript
describe('Empire Module', () => {
  describe('getEmpiresBatch', () => {
    it('returns empires for existing gamestate')
    it('returns empty array for gamestate with no empires')
    it('returns empty array for non-existent gamestate id')
    it('returns empires for multiple gamestates in batch')
    it('includes all empire fields')
    it('correctly identifies player empire')
    it('converts field names to camelCase')
  })

  describe('getPlayerEmpireBatch', () => {
    it('returns player empire for existing gamestate')
    it('returns null for gamestate with no player empire')
    it('returns null for non-existent gamestate id')
    it('includes all empire fields')
  })
})
```

##### `tests/db/diplomaticRelation.test.ts`

```typescript
describe('Diplomatic Relation Module', () => {
  describe('getDiplomaticRelationsBatch', () => {
    it('returns relations for existing gamestate')
    it('returns empty array for gamestate with no relations')
    it('returns empty array for non-existent gamestate id')
    it('returns relations for multiple gamestates in batch')
    it('includes all relation fields')
    it('handles null optional fields')
    it('converts field names to camelCase')
  })
})
```

##### `tests/db/planetCoordinate.test.ts`

```typescript
describe('Planet Coordinate Module', () => {
  describe('getPlanetCoordinatesBatch', () => {
    it('returns coordinates for existing gamestate')
    it('returns empty map for gamestate with no coordinates')
    it('returns empty map for non-existent gamestate id')
    it('returns coordinates for multiple gamestates in batch')
    it('correctly maps planet IDs to coordinates')
  })
})
```

#### 7.3 DataLoader Tests

##### Update `tests/graphql/dataloaders.test.ts`

Add new test sections:

```typescript
describe('createEmpiresLoader', () => {
  it('returns empires for existing gamestate')
  it('returns empty array for non-existent gamestate id')
  it('batches multiple requests')
  it('caches repeated requests')
})

describe('createPlayerEmpireLoader', () => {
  it('returns player empire for existing gamestate')
  it('returns null for non-existent gamestate id')
  it('batches multiple requests')
  it('caches repeated requests')
})

describe('createDiplomaticRelationsLoader', () => {
  it('returns relations for existing gamestate')
  it('returns empty array for non-existent gamestate id')
  it('batches multiple requests')
  it('caches repeated requests')
})

describe('createPlanetCoordinatesLoader', () => {
  it('returns coordinates for existing gamestate')
  it('returns empty map for non-existent gamestate id')
  it('batches multiple requests')
  it('caches repeated requests')
})
```

#### 7.4 GraphQL Integration Tests

##### Update `tests/saves.test.ts` or create new file

```typescript
describe('Gamestate Empires Query', () => {
  it('returns all empires for a gamestate')
  it('returns player empire for a gamestate')
  it('returns null player empire when none exists')
  it('includes empire fields in response')
})

describe('Gamestate Diplomatic Relations Query', () => {
  it('returns all relations for player empire')
  it('returns empty array when no relations')
  it('includes all relation fields')
})

describe('Planet Coordinate Query', () => {
  it('returns coordinate for planet')
  it('returns null coordinate when missing')
})
```

#### 7.5 Test Fixtures

Create SQL fixtures in `tests/fixtures/db/`:

##### `tests/fixtures/db/empire-data.sql`

```sql
-- Test save with empires
INSERT INTO save (save_id, filename, name) VALUES
  (100, 'empire-test.sav', 'Empire Test Save'),
  (101, 'no-empires.sav', 'No Empires Save');

INSERT INTO gamestate (gamestate_id, save_id, date, data) VALUES
  (100, 100, '2200-01-01', '{}'),
  (101, 101, '2200-01-01', '{}');

INSERT INTO empire (gamestate_id, country_id, name, is_player, owned_planet_count, controlled_planet_count) VALUES
  (100, '0', 'Human Empire', true, 5, 25),
  (100, '1', 'Alien Empire', false, 10, 50),
  (100, '2', 'Machine Empire', false, 3, 15);
```

##### `tests/fixtures/db/diplomatic-relation-data.sql`

```sql
-- Test save with diplomatic relations
INSERT INTO save (save_id, filename, name) VALUES
  (200, 'diplomacy-test.sav', 'Diplomacy Test Save');

INSERT INTO gamestate (gamestate_id, save_id, date, data) VALUES
  (200, 200, '2200-01-01', '{}');

INSERT INTO diplomatic_relation (
  gamestate_id, source_country_id, target_country_id,
  opinion, trust, threat, is_hostile, border_range
) VALUES
  (200, '0', '1', 50, 25, 0, false, 100),
  (200, '0', '2', -500, -10, 80, true, 50),
  (200, '0', '3', 0, 0, 0, false, 9999);
```

##### `tests/fixtures/db/planet-coordinate-data.sql`

```sql
-- Test save with planet coordinates
INSERT INTO save (save_id, filename, name) VALUES
  (300, 'coordinates-test.sav', 'Coordinates Test Save');

INSERT INTO gamestate (gamestate_id, save_id, date, data) VALUES
  (300, 300, '2200-01-01', '{}');

INSERT INTO planet_coordinate (gamestate_id, planet_id, x, y, system_id) VALUES
  (300, '7', -56.82, 85.08, 268),
  (300, '12', 100.5, -45.3, 512),
  (300, '25', 0.0, 0.0, 1);
```

#### 7.6 Name Extraction Helper Tests

##### `tests/parser/nameExtractor.test.ts`

```typescript
describe('Name Extractor', () => {
  describe('extractDisplayName', () => {
    it('extracts simple name format')
    it('extracts template name format with variables')
    it('strips EMPIRE_DESIGN_ prefix')
    it('strips NAME_ prefix')
    it('strips SPEC_ prefix')
    it('handles empty name object')
    it('handles null input')
    it('combines multiple variable parts')
  })

  describe('extractPlanetName', () => {
    it('extracts simple planet name')
    it('strips MAM1_PLANET_ prefix')
    it('strips MAM2_PLANET_ prefix')
    it('strips NEW_COLONY_NAME_ prefix')
    it('handles PLANET_NAME_FORMAT special case')
  })
})
```

---

## Test File Summary

| Test File | Test Count (approx) | Purpose |
|-----------|---------------------|---------|
| `tests/parser/empirePopulator.test.ts` | 15 | Empire data extraction |
| `tests/parser/diplomaticRelationPopulator.test.ts` | 10 | Relation data extraction |
| `tests/parser/planetCoordinatePopulator.test.ts` | 6 | Coordinate extraction |
| `tests/parser/nameExtractor.test.ts` | 10 | Name parsing utilities |
| `tests/db/empire.test.ts` | 8 | Empire DB queries |
| `tests/db/diplomaticRelation.test.ts` | 7 | Relation DB queries |
| `tests/db/planetCoordinate.test.ts` | 5 | Coordinate DB queries |
| `tests/graphql/dataloaders.test.ts` (update) | 16 | DataLoader functionality |
| GraphQL integration tests | 8 | End-to-end queries |
| **Total** | **~85 tests** | |

---

## Test Fixtures Summary

| Fixture File | Purpose |
|--------------|---------|
| `tests/fixtures/db/empire-data.sql` | Empire table test data |
| `tests/fixtures/db/diplomatic-relation-data.sql` | Relation table test data |
| `tests/fixtures/db/planet-coordinate-data.sql` | Coordinate table test data |

---

## Estimated Scope

| Component | New Files | Modified Files | Complexity |
|-----------|-----------|----------------|------------|
| Migrations | 3 | 0 | Low |
| Populators | 4 | 1 | Medium (name parsing) |
| DB Functions | 3 | 0 | Low |
| DataLoaders | 3 | 1 | Low |
| Schema/Resolvers | 0 | 3 | Low |
| Tests | 7 | 2 | Medium |
| Fixtures | 3 | 0 | Low |
| **Total** | **23** | **7** | |

### Summary

- **New source files**: 13
- **New test files**: 7
- **New fixture files**: 3
- **Modified files**: 7
- **Approximate test count**: ~85 tests
