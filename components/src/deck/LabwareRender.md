```js
const fixture96Plate = require('@opentrons/shared-data/fixtures/fixture96Plate')
const fixture24TubeRack = require('@opentrons/shared-data/fixtures/fixture24TubeRack')
const fixture12Trough = require('@opentrons/shared-data/fixtures/fixture12Trough')
const fixtureTipRack300Ul = require('@opentrons/shared-data/fixtures/fixtureTipRack300Ul')

// Change this to view different labware fixtures
let definition = fixture96Plate

;<LabwareRender showLabels definition={definition} />
```
