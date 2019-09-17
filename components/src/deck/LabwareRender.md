Note that `LabwareRender` is in robot coordinates, we transform it to view it using `RobotWorkSpace`.

**Normal Labware**

```js
const fixture_96_plate = require('@opentrons/shared-data/labware/fixtures/2/fixture_96_plate')
const fixture_24_tuberack = require('@opentrons/shared-data/labware/fixtures/2/fixture_24_tuberack')
const fixture_12_trough = require('@opentrons/shared-data/labware/fixtures/2/fixture_12_trough')
const fixture_tiprack_300_ul = require('@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul')

// Change this to view different labware fixtures
let definition = fixture_96_plate

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
const fixture_tiprack_300_ul = require('@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul')

let definition = fixture_tiprack_300_ul

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
