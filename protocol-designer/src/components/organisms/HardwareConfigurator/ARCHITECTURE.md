# Protocol Designer Deck Configuration Architecture

## Overview

Protocol Designer manages deck hardware configuration through a layered system that tracks which modules and fixtures are placed on the Flex deck during protocol creation.

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FORM STATE (React Hook Form)                    │
│                                                                         │
│   modules: FormModules          fixtures: Fixtures                     │
│   ┌─────────────────────┐       ┌─────────────────────┐                │
│   │ { model, slot, ... }│       │ { name, cutoutId }  │                │
│   └─────────────────────┘       └─────────────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      HardwareConfigurator                               │
│                                                                         │
│   Transforms form state into deck configuration                        │
│   - moduleConfig: CutoutConfigMap[]                                    │
│   - additionalEquipmentConfig: DeckConfiguration                       │
│   - Merges into combo fixtures where applicable                        │
└─────────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         REDUX STATE                                     │
│                                                                         │
│   deckConfig: DeckConfiguration                                        │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ [{ cutoutId, cutoutFixtureId, addressableAreaId }, ...]         │  │
│   └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Components

| Component                       | Location                                                 | Purpose                                          |
| ------------------------------- | -------------------------------------------------------- | ------------------------------------------------ |
| `HardwareConfigurator`          | `HardwareConfigurator/index.tsx`                         | Transforms form modules/fixtures into deckConfig |
| `HardwareConfiguratorContainer` | `HardwareConfigurator/HardwareConfiguratorContainer.tsx` | Passes deck data to DeckConfigurator UI          |
| `updateInitialDeckState`        | `FlexHardware/util.ts`                                   | Handles add/remove actions from deck clicks      |
| `AddFixtureModal`               | `HardwareConfigurator/AddFixtureModal.tsx`               | Modal for selecting fixtures to add              |

---

## HardwareConfigurator Logic

```typescript
// 1. Start with empty deck (all single-slot fixtures)
const emptyDeckConfiguration = getEmptyDeckConfiguration(deckDef)

// 2. Filter out slots that have modules or fixtures
const simpleDeckConfig = emptyDeckConfiguration.filter(({ cutoutId }) => {
  const hasModule = modules.some(m => getCutoutIdFromAddressableArea(m.slot) === cutoutId)
  const hasFixture = fixtures.some(f => f.cutoutId === cutoutId)
  return !hasModule && !hasFixture
})

// 3. Build module configs (includes logic for another thermocycler slot)
const moduleConfig = modules.flatMap(module =>
  getAddedMissingThermocyclerFixtures([...], deckDef)
)

// 4. Build fixture configs
const additionalEquipmentConfig = fixtures.map(fixture => ({...}))

// 5. Merge modules + fixtures into combos where applicable
const { comboFixtures, remainingModuleConfig, remainingAdditionalEquipmentConfig } =
  mergeToComboFixtures(moduleConfig, additionalEquipmentConfig)

// 6. Final deck config
const updatedDeckConfig = [
  ...simpleDeckConfig,
  ...remainingModuleConfig,
  ...remainingAdditionalEquipmentConfig,
  ...comboFixtures,
]
```

---

## updateInitialDeckState Logic

When user clicks a slot on the deck:

```
User clicks slot
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Determine action based on:                                     │
│  - newFixtureName (what user selected)                         │
│  - isModuleFixture (is it a module?)                           │
│  - matchingModuleOnDeck (existing module at slot?)             │
│  - matchingFixtureOnDeck (existing fixture at slot?)           │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  REMOVING (single-slot fixture selected = clearing slot)        │
│  ├─ Module exists? → Delete module                             │
│  └─ Fixture exists? → Delete fixture                           │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  ADDING FIXTURE                                                 │
│  ├─ Both module + fixture exist? → Delete module (combo)       │
│  ├─ Only fixture exists? → Delete fixture (replace)            │
│  └─ Nothing exists? → Create fixture                           │
└─────────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────────┐
│  ADDING MODULE                                                  │
│  ├─ Both module + fixture exist? → Delete fixture (combo)      │
│  ├─ Only module exists? → Delete module (replace)              │
│  └─ Nothing exists? → Create module                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Combo Fixtures

When a module and fixture share a cutoutId, they merge into a combo fixture:

| Module       | Fixture                 | Combo                                     |
| ------------ | ----------------------- | ----------------------------------------- |
| Flex Stacker | Waste Chute (covered)   | `flexStackerWithWasteChuteAdapterCovered` |
| Flex Stacker | Waste Chute (uncovered) | `flexStackerWithWasteChuteAdapterNoCover` |
| Flex Stacker | Magnetic Block          | `flexStackerWithMagBlock`                 |
| Staging Area | Magnetic Block          | `stagingAreaSlotWithMagneticBlockV1`      |

---

## Multi-Slot Modules

Thermocycler spans two cutouts (A1 + B1):

- `thermocyclerModuleV2Front` at `cutoutB1`
- `thermocyclerModuleV2Rear` at `cutoutA1`

When adding: `getAddedMissingThermocyclerFixtures()` adds the rear fixture automatically.

When removing: `getNewConfigForDeckConfig()` updates both cutouts.
