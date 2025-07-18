import { useState } from 'react'

import {
  ALIGN_CENTER,
  C_LIGHT_GRAY,
  DIRECTION_COLUMN,
  Flex,
  FONT_BODY_2_DARK,
  FONT_STYLE_ITALIC,
  JUSTIFY_SPACE_AROUND,
  LabwareRender,
  RadioGroup,
  RobotWorkSpace,
  SPACING,
  StyledText,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import {
  createIrregularLabware,
  createRegularLabware,
  getAddressableAreaFromSlotId,
  getDeckDefinitions,
  getDeckSlotOriginToLabwareOrigin,
  getLabwareViewBox,
  getPositionFromSlotId,
} from '@opentrons/shared-data'

import styles from './createlabwaresandbox.module.css'
import { IRREGULAR_OPTIONS, REGULAR_OPTIONS } from './fixtures'

import type { ChangeEventHandler } from 'react'
import type {
  AddressableAreaName,
  IrregularLabwareProps,
  LabwareDefinition,
  RegularLabwareProps,
} from '@opentrons/shared-data'

const DECK_DEFINITION = getDeckDefinitions().ot2_standard
const SLOT_OPTIONS = DECK_DEFINITION.locations.addressableAreas.map(
  slot => slot.id
)
const DEFAULT_LABWARE_SLOT = SLOT_OPTIONS[0]

export function CreateLabwareSandbox(): JSX.Element {
  const [labwareSlot, setLabwareSlot] = useState(DEFAULT_LABWARE_SLOT)
  const [isLabwareRegular, setIsLabwareRegular] = useState(false)
  const [viewOnDeck, setViewOnDeck] = useState(true)
  const [rawOptions, setRawOptions] = useState(
    JSON.stringify(IRREGULAR_OPTIONS, undefined, 2)
  )
  const [labwareToRender, setLabwareToRender] = useState<LabwareDefinition>(
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
  const handleRegularityChange: ChangeEventHandler<HTMLInputElement> = e => {
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

  const handleOnDeckChange: ChangeEventHandler<HTMLInputElement> = e => {
    setViewOnDeck(e.target.value === 'deck')
  }

  const handleInputOptionChange: ChangeEventHandler<HTMLTextAreaElement> = event => {
    setRawOptions(event.target.value)
    const createLabware = isLabwareRegular
      ? createRegularLabware
      : createIrregularLabware
    try {
      setLabwareToRender(
        createLabware(
          JSON.parse(event.target.value) as IrregularLabwareProps &
            RegularLabwareProps
        )
      )
    } catch (error) {
      console.log('Failed to parse options as JSON', error)
    }
  }

  const labwareViewBox = getLabwareViewBox(labwareToRender)

  return (
    <Flex height="100%" width="100%" flexDirection={DIRECTION_COLUMN}>
      <Flex flex={2} alignItems={ALIGN_CENTER} backgroundColor={C_LIGHT_GRAY}>
        <StyledText as="h1" margin={SPACING.spacing16}>
          Create
        </StyledText>
        <RadioGroup
          onChange={handleRegularityChange}
          value={isLabwareRegular ? 'regular' : 'irregular'}
          options={[
            { name: 'Regular', value: 'regular' },
            { name: 'Irregular', value: 'irregular' },
          ]}
        />
        <StyledText as="h1" margin={SPACING.spacing16}>
          Labware
        </StyledText>
      </Flex>
      <Flex
        flex={8}
        justifyContent={JUSTIFY_SPACE_AROUND}
        marginTop={SPACING.spacing8}
      >
        <Flex
          flex={2}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
        >
          <Flex alignItems={ALIGN_CENTER}>
            <StyledText as="h2" margin={SPACING.spacing8}>
              Input
            </StyledText>
            <StyledText
              css={FONT_BODY_2_DARK}
              fontStyle={FONT_STYLE_ITALIC}
            >{` (${regularityLabel} Labware Options)`}</StyledText>
          </Flex>
          <textarea
            className={styles.json_text_area}
            title="input options"
            value={optionsTextAreaValue}
            onChange={handleInputOptionChange}
          />
        </Flex>
        <Flex flex={5} flexDirection={DIRECTION_COLUMN}>
          <Flex
            marginX={SPACING.spacing32}
            marginY={SPACING.spacing4}
            alignItems={ALIGN_CENTER}
          >
            <StyledText as="h2" marginRight={SPACING.spacing8}>
              {`Render ${regularityLabel} Labware`}
            </StyledText>
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
                <StyledText as="h2" marginX={SPACING.spacing16}>
                  {' '}
                  In Slot:
                </StyledText>
                <select
                  className={styles.slot_select}
                  defaultValue={labwareSlot}
                  title="Select slot for labware placement"
                  onChange={e => {
                    setLabwareSlot(e.target.value as AddressableAreaName)
                  }}
                >
                  {SLOT_OPTIONS.map(slot => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </Flex>
            ) : null}
          </Flex>
          <Flex maxHeight="84vh">
            {viewOnDeck ? (
              <RobotWorkSpace deckDef={DECK_DEFINITION} showDeckLayers>
                {() => {
                  const slotOrigin = getPositionFromSlotId(
                    labwareSlot,
                    DECK_DEFINITION
                  )
                  const slotDefinition = getAddressableAreaFromSlotId(
                    labwareSlot,
                    DECK_DEFINITION
                  )

                  if (slotOrigin == null || slotDefinition == null) {
                    return null // Should not happen.
                  }

                  const slotOriginToLabwareOrigin = getDeckSlotOriginToLabwareOrigin(
                    slotDefinition,
                    labwareToRender
                  )

                  return (
                    <g
                      transform={`translate(${slotOrigin[0]}, ${slotOrigin[1]})`}
                      data-testid="lw_on_deck"
                    >
                      <g
                        transform={`translate(${slotOriginToLabwareOrigin.x}, ${slotOriginToLabwareOrigin.y})`}
                      >
                        <LabwareRender
                          definition={labwareToRender}
                          positioningMode="passThrough"
                          wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE}
                        />
                      </g>
                    </g>
                  )
                }}
              </RobotWorkSpace>
            ) : (
              <svg
                data-testid="lw_by_itself"
                width="100%"
                viewBox={`${labwareViewBox.minX} ${labwareViewBox.minY} ${labwareViewBox.xDimension} ${labwareViewBox.yDimension}`}
                style={{ transform: 'scale(1, -1)' }}
              >
                <LabwareRender
                  definition={labwareToRender}
                  positioningMode="passThrough"
                  wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE}
                />
              </svg>
            )}
          </Flex>
        </Flex>
        <Flex flex={2} flexDirection={DIRECTION_COLUMN}>
          <Flex alignItems={ALIGN_CENTER}>
            <StyledText as="h2" margin={SPACING.spacing8}>
              Output
            </StyledText>
            <StyledText
              css={FONT_BODY_2_DARK}
              fontStyle={FONT_STYLE_ITALIC}
            >{` (${regularityLabel} Labware Definition)`}</StyledText>
          </Flex>
          <textarea
            className={styles.json_text_area}
            title="output definition"
            value={JSON.stringify(labwareToRender, undefined, 2)}
            disabled
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
