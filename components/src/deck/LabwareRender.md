Note that `LabwareRender` is in robot coordinates, we transform it to view it using `RobotWorkSpace`.

**Normal Labware**

```js
const fixture96Plate = require('@opentrons/shared-data/fixtures/fixture96Plate')
const fixture24TubeRack = require('@opentrons/shared-data/fixtures/fixture24TubeRack')
const fixture12Trough = require('@opentrons/shared-data/fixtures/fixture12Trough')
const fixtureTipRack300Ul = require('@opentrons/shared-data/fixtures/fixtureTipRack300Ul')

// Change this to view different labware fixtures
let definition = fixture96Plate

;<RobotWorkSpace
  viewBox={`0 0  ${definition.dimensions.xDimension} ${
    definition.dimensions.yDimension
  }`}
>
  {() => (
    <LabwareRender
      showLabels
      definition={definition}
      highlightedWells={{ A1: null, B2: null }}
      wellFill={{ A1: 'maroon', C3: 'lavender' }}
    />
  )}
</RobotWorkSpace>
```

**Tiprack**

```js
const fixtureTipRack300Ul = require('@opentrons/shared-data/fixtures/fixtureTipRack300Ul')

let definition = fixtureTipRack300Ul

;<RobotWorkSpace
  viewBox={`0 0  ${definition.dimensions.xDimension} ${
    definition.dimensions.yDimension
  }`}
>
  {() => (
    <LabwareRender
      definition={definition}
      highlightedWells={{ A1: null, B2: null }}
      missingTips={{ C3: null, D4: null }}
    />
  )}
</RobotWorkSpace>
```
