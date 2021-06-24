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
  SIZE_6,
  FONT_STYLE_ITALIC,
  FONT_BODY_2_DARK,
  SPACING_2,
  SPACING_3,
  RadioGroup,
  JUSTIFY_CENTER,
  SIZE_3,
} from '@opentrons/components'
import { createIrregularLabware, createRegularLabware } from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { IRREGULAR_OPTIONS, REGULAR_OPTIONS } from './fixtures'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

const SLOT_OPTIONS = standardDeckDef.locations.orderedSlots.map(slot => slot.id)
const DEFAULT_LABWARE_SLOT = SLOT_OPTIONS[0]

const SlotSelect = styled.select`
  height: 1.5rem;
  width: 2rem;
`
const JsonTextArea = styled.textarea`
  height: 95vh;
  width: 30rem;
`

export function IrregularLabwareSandbox(): JSX.Element {
  const [labwareSlot, setLabwareSlot] = React.useState(DEFAULT_LABWARE_SLOT)
  const [isLabwareRegular, setIsLabwareRegular] = React.useState(false)
  const [viewOnDeck, setViewOnDeck] = React.useState(true)
  const [rawOptions, setRawOptions] = React.useState(
    JSON.stringify(isLabwareRegular ? REGULAR_OPTIONS : IRREGULAR_OPTIONS, undefined, 2)
  )
  const createLabware = isLabwareRegular ? createRegularLabware : createIrregularLabware
  const [labwareToRender, setLabwareToRender] = React.useState<LabwareDefinition2>(
    createLabware(JSON.parse(rawOptions))
  )

  let optionsTextAreaValue = rawOptions
  try {
    // re-prettify input if valid JSON
    optionsTextAreaValue = JSON.stringify(JSON.parse(rawOptions), undefined, 2)
  } catch (error) {
    console.log('Failed to parse options as JSON', error)
  }

  const regularityLabel = isLabwareRegular ? 'Regular' : 'Irregular'
  const handleRegularityChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const willBeRegular = e.target.value === 'regular'
    const nextDefaultOptions = willBeRegular ? REGULAR_OPTIONS : IRREGULAR_OPTIONS
    const nextCreateLabware = willBeRegular ? createRegularLabware : createIrregularLabware
    setRawOptions(JSON.stringify(nextDefaultOptions, undefined, 2))
    setLabwareToRender(nextCreateLabware(nextDefaultOptions))
    setIsLabwareRegular(willBeRegular)
  }

  const handleOnDeckChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const willBeOnDeck = e.target.value === 'deck'
    setViewOnDeck(willBeOnDeck)
  }

  return (
    <>
      <Flex width={SIZE_6} flexDirection={DIRECTION_COLUMN}>
        <Flex alignItems={ALIGN_CENTER}>
          <Text as="h1" margin={SPACING_3}>Create</Text>
          <RadioGroup
              onChange={handleRegularityChange}
              value={isLabwareRegular ? 'regular' : 'irregular'}
              options={[
                {name: 'Regular', value: 'regular'},
                {name: 'Irregular', value: 'irregular'},
              ]} />
          <Text as="h1" margin={SPACING_3}>Labware</Text>
        </Flex>

        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          height="100%"
        >
          <Flex alignItems={ALIGN_CENTER}>
            <Text as="h2" marginRight={SPACING_2}>Input</Text>
            <Text css={FONT_BODY_2_DARK} fontStyle={FONT_STYLE_ITALIC}>{` (${regularityLabel} Labware Options)`}</Text>
          </Flex>
          <JsonTextArea
            value={optionsTextAreaValue}
            onChange={event => {
              setRawOptions(event.target.value)
              try {
                setLabwareToRender(createLabware(JSON.parse(event.target.value)))
              } catch (error) {
                console.log('Failed to parse options as JSON', error)
              }
            }}
          />
        </Flex>
      </Flex>
      <Flex flex={1} flexDirection={DIRECTION_COLUMN} justifyContent={JUSTIFY_CENTER}>
        <Flex
            width={SIZE_3}
            alignItems={ALIGN_CENTER}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Text>Slot:</Text>
            <SlotSelect defaultValue={DEFAULT_LABWARE_SLOT} onChange={e => setLabwareSlot(e.target.value)}>
              {SLOT_OPTIONS.map(slot => (
                <option  key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </SlotSelect>
            <RadioGroup
              onChange={handleOnDeckChange}
              value={viewOnDeck ? 'deck' : 'standalone'}
              options={[
                {name: 'View On Deck', value: 'deck'},
                {name: 'View Standalone Labware', value: 'standalone'},
              ]} />
          </Flex>
          {viewOnDeck
            ? (
              <RobotWorkSpace deckDef={standardDeckDef as any}>
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
            ) : (
              <svg width="100%">
                <LabwareRender definition={labwareToRender} />
              </svg>
            )
          }
      </Flex>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        height="100%"
      >
        <Flex alignItems={ALIGN_CENTER}>
          <Text as="h2" marginRight={SPACING_2}>Output</Text>
          <Text css={FONT_BODY_2_DARK} fontStyle={FONT_STYLE_ITALIC}>{` (${regularityLabel} Labware Definition)`}</Text>
        </Flex>
        <JsonTextArea
          value={JSON.stringify(labwareToRender, undefined, 2)}
          disabled
        />
      </Flex>
    </>
  )
}
