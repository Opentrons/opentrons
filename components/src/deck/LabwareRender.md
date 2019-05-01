Note that `LabwareRender` is in robot coordinates, we transform it to view it using `SlotView`.

**Normal Labware**

```js
const fixture96Plate = require('@opentrons/shared-data/fixtures/fixture96Plate')
const fixture24TubeRack = require('@opentrons/shared-data/fixtures/fixture24TubeRack')
const fixture12Trough = require('@opentrons/shared-data/fixtures/fixture12Trough')
const fixtureTipRack300Ul = require('@opentrons/shared-data/fixtures/fixtureTipRack300Ul')

// Change this to view different labware fixtures
let definition = fixture96Plate

;<SlotView>
  <LabwareRender
    showLabels
    definition={definition}
    highlightedWells={new Set(['A1', 'B2'])}
    wellFill={{ A1: 'maroon', C3: 'lavender' }}
  />
</SlotView>
```

**Tiprack**

```js
const fixtureTipRack300Ul = require('@opentrons/shared-data/fixtures/fixtureTipRack300Ul')

let definition = fixtureTipRack300Ul

;<SlotView>
  <LabwareRender
    definition={definition}
    highlightedWells={new Set(['A1', 'B2'])}
    missingTips={new Set(['C3', 'D4'])}
  />
</SlotView>
```
