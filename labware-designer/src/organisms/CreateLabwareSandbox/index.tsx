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
  getPositionFromSlotId,
  ot2StandardDeckV4,
} from '@opentrons/shared-data'

import styles from './createlabwaresandbox.module.css'
import { IRREGULAR_OPTIONS, REGULAR_OPTIONS } from './fixtures'

import type {
  DeckDefinition,
  IrregularLabwareProps,
  LabwareDefinition2,
  RegularLabwareProps,
} from '@opentrons/shared-data'

const SLOT_OPTIONS = ot2StandardDeckV4.locations.addressableAreas.map(
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
  const [labwareToRender, setLabwareToRender] = useState<LabwareDefinition2>(
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
                    setLabwareSlot(e.target.value)
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
              <RobotWorkSpace
                deckDef={(ot2StandardDeckV4 as unknown) as DeckDefinition}
                showDeckLayers
              >
                {() => {
                  const lwPosition = getPositionFromSlotId(
                    labwareSlot,
                    (ot2StandardDeckV4 as unknown) as DeckDefinition
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
                        positioningMode="offsetInSlot"
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
                  positioningMode="offsetInSlot"
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
