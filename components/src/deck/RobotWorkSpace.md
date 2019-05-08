Robot Work Space Visualization:

```js
const { getDeckDefinitions } = require('./getDeckDefinitions')
const deckDef = getDeckDefinitions()['ot2_standard']
const slotName = '5'
const divSlot = '3'
;<RobotWorkSpace deckDef={deckDef}>
  {({ slots }) => (
    <>
      <rect
        x={slots[slotName].position[0]}
        y={slots[slotName].position[1]}
        width={slots[slotName].boundingBox.xDimension}
        height={slots[slotName].boundingBox.yDimension}
        fill="#0075ff33"
      />
      <RobotCoordsText
        x={slots[slotName].position[0] + 10}
        y={slots[slotName].position[1] + 10}
        fill="gray"
      >
        Some Text
      </RobotCoordsText>
      <RobotCoordsForeignDiv
        x={slots[divSlot].position[0]}
        y={slots[divSlot].position[1]}
        width={slots[divSlot].boundingBox.xDimension}
        height={slots[divSlot].boundingBox.yDimension}
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
