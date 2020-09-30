Robot Work Space Visualization:

```js
import { RobotCoordsText, RobotCoordsForeignDiv } from '@opentrons/components'
import { getDeckDefinitions } from './getDeckDefinitions'
const deckDef = getDeckDefinitions()['ot2_standard']
const slotName = '5'
const divSlot = '3'
;<RobotWorkSpace deckDef={deckDef}>
  {({ deckSlotsById }) => (
    <>
      <rect
        x={deckSlotsById[slotName].position[0]}
        y={deckSlotsById[slotName].position[1]}
        width={deckSlotsById[slotName].boundingBox.xDimension}
        height={deckSlotsById[slotName].boundingBox.yDimension}
        fill="#0075ff33"
      />
      <RobotCoordsText
        x={deckSlotsById[slotName].position[0] + 10}
        y={deckSlotsById[slotName].position[1] + 10}
        fill="gray"
      >
        Some Text
      </RobotCoordsText>
      <RobotCoordsForeignDiv
        x={deckSlotsById[divSlot].position[0]}
        y={deckSlotsById[divSlot].position[1]}
        width={deckSlotsById[divSlot].boundingBox.xDimension}
        height={deckSlotsById[divSlot].boundingBox.yDimension}
      >
        <input
          style={{ backgroundColor: 'lightgray', margin: '1rem' }}
          placeholder="example input"
        />
      </RobotCoordsForeignDiv>
    </>
  )}
</RobotWorkSpace>
```
