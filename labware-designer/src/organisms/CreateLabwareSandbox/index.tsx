import * as React from 'react'
import styled from 'styled-components'
import {
  Flex,
  Text,
  RobotWorkSpace,
  LabwareRender,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  JUSTIFY_SPACE_AROUND,
  FONT_STYLE_ITALIC,
  FONT_BODY_2_DARK,
  SPACING_2,
  SPACING_3,
  SPACING_4,
  RadioGroup,
  SPACING_1,
  C_LIGHT_GRAY,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import {
  createIrregularLabware,
  createRegularLabware,
  getPositionFromSlotId,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/4/ot2_standard.json'
import { IRREGULAR_OPTIONS, REGULAR_OPTIONS } from './fixtures'

import type { DeckDefinition, LabwareDefinition2 } from '@opentrons/shared-data'

const SLOT_OPTIONS = standardDeckDef.locations.addressableAreas.map(
  slot => slot.id
)
const DEFAULT_LABWARE_SLOT = SLOT_OPTIONS[0]

const SlotSelect = styled.select`
  height: 1.5rem;
  width: 2rem;
`
const JsonTextArea = styled.textarea`
  min-height: 84vh;
  width: 100%;
`

export function CreateLabwareSandbox(): JSX.Element {
  const [labwareSlot, setLabwareSlot] = React.useState(DEFAULT_LABWARE_SLOT)
  const [isLabwareRegular, setIsLabwareRegular] = React.useState(false)
  const [viewOnDeck, setViewOnDeck] = React.useState(true)
  const [rawOptions, setRawOptions] = React.useState(
    JSON.stringify(IRREGULAR_OPTIONS, undefined, 2)
  )
  const [
    labwareToRender,
    setLabwareToRender,
  ] = React.useState<LabwareDefinition2>(
    createIrregularLabware(IRREGULAR_OPTIONS)
  )

  let optionsTextAreaValue = rawOptions
  try {
    // re-prettify input if valid JSON
    optionsTextAreaValue = JSON.stringify(JSON.parse(rawOptions), undefined, 2)
  } catch (error) {
    console.log('Failed to parse options as JSON', error)
  }

  const regularityLabel = isLabwareRegular ? 'Regular' : 'Irregular'
  const handleRegularityChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    const willBeRegular = e.target.value === 'regular'
    setRawOptions(
      JSON.stringify(
        willBeRegular ? REGULAR_OPTIONS : IRREGULAR_OPTIONS,
        undefined,
        2
      )
    )
    setLabwareToRender(
      willBeRegular
        ? createRegularLabware(REGULAR_OPTIONS)
        : createIrregularLabware(IRREGULAR_OPTIONS)
    )
    setIsLabwareRegular(willBeRegular)
  }

  const handleOnDeckChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    setViewOnDeck(e.target.value === 'deck')
  }

  const handleInputOptionChange: React.ChangeEventHandler<HTMLTextAreaElement> = event => {
    setRawOptions(event.target.value)
    const createLabware = isLabwareRegular
      ? createRegularLabware
      : createIrregularLabware
    try {
      setLabwareToRender(createLabware(JSON.parse(event.target.value)))
    } catch (error) {
      console.log('Failed to parse options as JSON', error)
    }
  }

  return (
    <Flex height="100%" width="100%" flexDirection={DIRECTION_COLUMN}>
      <Flex flex={2} alignItems={ALIGN_CENTER} backgroundColor={C_LIGHT_GRAY}>
        <Text as="h1" margin={SPACING_3}>
          Create
        </Text>
        <RadioGroup
          onChange={handleRegularityChange}
          value={isLabwareRegular ? 'regular' : 'irregular'}
          options={[
            { name: 'Regular', value: 'regular' },
            { name: 'Irregular', value: 'irregular' },
          ]}
        />
        <Text as="h1" margin={SPACING_3}>
          Labware
        </Text>
      </Flex>
      <Flex
        flex={8}
        justifyContent={JUSTIFY_SPACE_AROUND}
        marginTop={SPACING_2}
      >
        <Flex
          flex={2}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
        >
          <Flex alignItems={ALIGN_CENTER}>
            <Text as="h2" margin={SPACING_2}>
              Input
            </Text>
            <Text
              css={FONT_BODY_2_DARK}
              fontStyle={FONT_STYLE_ITALIC}
            >{` (${regularityLabel} Labware Options)`}</Text>
          </Flex>
          <JsonTextArea
            title="input options"
            value={optionsTextAreaValue}
            onChange={handleInputOptionChange}
          />
        </Flex>
        <Flex flex={5} flexDirection={DIRECTION_COLUMN}>
          <Flex
            marginX={SPACING_4}
            marginY={SPACING_1}
            alignItems={ALIGN_CENTER}
          >
            <Text as="h2" marginRight={SPACING_2}>
              {`Render ${regularityLabel} Labware`}
            </Text>
            <RadioGroup
              onChange={handleOnDeckChange}
              value={viewOnDeck ? 'deck' : 'standalone'}
              options={[
                { name: 'On Deck', value: 'deck' },
                { name: 'By Itself', value: 'standalone' },
              ]}
            />

            {viewOnDeck ? (
              <Flex alignItems={ALIGN_CENTER}>
                <Text as="h2" marginX={SPACING_3}>
                  {' '}
                  In Slot:
                </Text>
                <SlotSelect
                  defaultValue={labwareSlot}
                  onChange={e => setLabwareSlot(e.target.value)}
                >
                  {SLOT_OPTIONS.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </SlotSelect>
              </Flex>
            ) : null}
          </Flex>
          <Flex maxHeight="84vh">
            {viewOnDeck ? (
              <RobotWorkSpace
                deckDef={(standardDeckDef as unknown) as DeckDefinition}
                showDeckLayers
              >
                {() => {
                  const lwPosition = getPositionFromSlotId(
                    labwareSlot,
                    (standardDeckDef as unknown) as DeckDefinition
                  )
                  return (
                    <g
                      transform={`translate(${lwPosition?.[0] ?? 0}, ${
                        lwPosition?.[1] ?? 0
                      })`}
                      data-testid="lw_on_deck"
                    >
                      <LabwareRender
                        definition={labwareToRender}
                        wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE}
                      />
                    </g>
                  )
                }}
              </RobotWorkSpace>
            ) : (
              <svg
                data-testid="lw_by_itself"
                width="100%"
                viewBox={`0 0 ${labwareToRender.dimensions.xDimension} ${labwareToRender.dimensions.yDimension}`}
                style={{ transform: 'scale(1, -1)' }}
              >
                <LabwareRender
                  definition={labwareToRender}
                  wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE}
                />
              </svg>
            )}
          </Flex>
        </Flex>
        <Flex flex={2} flexDirection={DIRECTION_COLUMN}>
          <Flex alignItems={ALIGN_CENTER}>
            <Text as="h2" margin={SPACING_2}>
              Output
            </Text>
            <Text
              css={FONT_BODY_2_DARK}
              fontStyle={FONT_STYLE_ITALIC}
            >{` (${regularityLabel} Labware Definition)`}</Text>
          </Flex>
          <JsonTextArea
            title="output definition"
            value={JSON.stringify(labwareToRender, undefined, 2)}
            disabled
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
