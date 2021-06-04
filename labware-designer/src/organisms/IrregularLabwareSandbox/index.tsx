import * as React from 'react'
import styled from 'styled-components'
import {
  Flex,
  Text,
  RobotWorkSpace,
  LabwareRender,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_BETWEEN,
  SIZE_4,
  SIZE_6,
} from '@opentrons/components'
import { createIrregularLabware } from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { falconTubeOptions } from './falconTubeOptions'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

const SLOT_OPTIONS = standardDeckDef.locations.orderedSlots.map(slot => slot.id)
const DEFAULT_LABWARE_SLOT = SLOT_OPTIONS[0]

const SlotSelect = styled.select`
  height: 1.5rem;
  width: 2rem;
`
const JsonTextArea = styled.textarea`
  height: 95vh;
  width: 300px;
`

export function IrregularLabwareSandbox(): JSX.Element {
  const [labwareSlot, setLabwareSlot] = React.useState(DEFAULT_LABWARE_SLOT)
  const [rawOptions, setRawOptions] = React.useState(
    JSON.stringify(falconTubeOptions, undefined, 2)
  )
  const [labwareToRender, setLabwareToRender] = React.useState<LabwareDefinition2>(
    createIrregularLabware(JSON.parse(JSON.stringify(falconTubeOptions, undefined, 2)))
  )

  let optionsTextAreaValue = rawOptions
  try {
    // re-prettify input if valid JSON
    optionsTextAreaValue = JSON.stringify(JSON.parse(rawOptions), undefined, 2)
  } catch (error) {
    console.log('Failed to parse options as JSON', error)
  }

  return (
    <>
      <Flex width={SIZE_6} flexDirection={DIRECTION_COLUMN}>
        <Flex
          width={SIZE_4}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
        >
          <Text>Labware Slot:</Text>
          <SlotSelect defaultValue={DEFAULT_LABWARE_SLOT} onChange={e => setLabwareSlot(e.target.value)}>
            {SLOT_OPTIONS.map(slot => (
              <option  key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </SlotSelect>
        </Flex>
        <RobotWorkSpace deckDef={standardDeckDef as any} viewBox={`-46 -10 488 390`}>
          {({ deckSlotsById }) => {
            const lwSlot = deckSlotsById[labwareSlot]
            return (
              <g
                transform={`translate(${lwSlot.position[0]}, ${lwSlot.position[1]})`}
              >
                <LabwareRender definition={labwareToRender} />
              </g>
            )
          }}
        </RobotWorkSpace>
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        height="100%"
      >
        <Text>Input Options:</Text>
        <JsonTextArea
          value={optionsTextAreaValue}
          onChange={event => {
            setRawOptions(event.target.value)
            try {
              setLabwareToRender(createIrregularLabware(JSON.parse(rawOptions)))
            } catch (error) {
              console.log('Failed to parse options as JSON', error)
            }
          }}
        />
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        height="100%"
      >
        <Text>Output Definition:</Text>
        <JsonTextArea
          value={JSON.stringify(labwareToRender, undefined, 2)}
          disabled
        />
      </Flex>
    </>
  )
}
