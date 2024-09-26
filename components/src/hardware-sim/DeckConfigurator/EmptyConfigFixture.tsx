import { css } from 'styled-components'

import { Icon } from '../../icons'
import { Btn } from '../../primitives'
import { ALIGN_CENTER, DISPLAY_FLEX, JUSTIFY_CENTER } from '../../styles'
import { RESPONSIVENESS } from '../../ui-style-constants'
import { BORDERS, COLORS } from '../../helix-design-system'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  COLUMN_1_SINGLE_SLOT_FIXTURE_WIDTH,
  COLUMN_2_SINGLE_SLOT_FIXTURE_WIDTH,
  COLUMN_3_SINGLE_SLOT_FIXTURE_WIDTH,
  COLUMN_1_X_ADJUSTMENT,
  COLUMN_2_X_ADJUSTMENT,
  COLUMN_3_X_ADJUSTMENT,
  FIXTURE_HEIGHT,
  Y_ADJUSTMENT,
} from './constants'

import type { CutoutId, DeckDefinition } from '@opentrons/shared-data'

interface EmptyConfigFixtureProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  handleClickAdd: (fixtureLocation: CutoutId) => void
}

export function EmptyConfigFixture(
  props: EmptyConfigFixtureProps
): JSX.Element {
  const { deckDefinition, handleClickAdd, fixtureLocation } = props

  const standardSlotCutout = deckDefinition.locations.cutouts.find(
    cutout => cutout.id === fixtureLocation
  )

  /**
   * deck definition cutout position is the position of the single slot located within that cutout
   * so, to get the position of the cutout itself we must add an adjustment to the slot position
   * the adjustment for x is different for right side/left side
   */
  const [xSlotPosition = 0, ySlotPosition = 0] =
    standardSlotCutout?.position ?? []
  let x = xSlotPosition
  let width = 0
  switch (fixtureLocation) {
    case 'cutoutA1':
    case 'cutoutB1':
    case 'cutoutC1':
    case 'cutoutD1': {
      x = xSlotPosition + COLUMN_1_X_ADJUSTMENT
      width = COLUMN_1_SINGLE_SLOT_FIXTURE_WIDTH
      break
    }
    case 'cutoutA2':
    case 'cutoutB2':
    case 'cutoutC2':
    case 'cutoutD2': {
      x = xSlotPosition + COLUMN_2_X_ADJUSTMENT
      width = COLUMN_2_SINGLE_SLOT_FIXTURE_WIDTH
      break
    }
    case 'cutoutA3':
    case 'cutoutB3':
    case 'cutoutC3':
    case 'cutoutD3': {
      x = xSlotPosition + COLUMN_3_X_ADJUSTMENT
      width = COLUMN_3_SINGLE_SLOT_FIXTURE_WIDTH
      break
    }
  }

  const y = ySlotPosition + Y_ADJUSTMENT

  return (
    <RobotCoordsForeignObject
      width={width}
      height={FIXTURE_HEIGHT}
      x={x}
      y={y}
      flexProps={{ flex: '1' }}
      foreignObjectProps={{ flex: '1' }}
    >
      <Btn
        css={EMPTY_CONFIG_STYLE}
        onClick={() => {
          handleClickAdd(fixtureLocation)
        }}
      >
        <Icon name="add" color={COLORS.blue50} size="2rem" />
      </Btn>
    </RobotCoordsForeignObject>
  )
}

const EMPTY_CONFIG_STYLE = css`
  display: ${DISPLAY_FLEX};
  align-items: ${ALIGN_CENTER};
  justify-content: ${JUSTIFY_CENTER};
  background-color: ${COLORS.blue30};
  border: 3px dashed ${COLORS.blue50};
  border-radius: ${BORDERS.borderRadius4};
  width: 100%;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    background-color: ${COLORS.blue35};
  }

  &:active {
    border: 3px solid ${COLORS.blue50};
    background-color: ${COLORS.blue40};
  }

  &:focus {
    border: 3px solid ${COLORS.blue50};
    background-color: ${COLORS.blue40};
  }

  &:hover {
    background-color: ${COLORS.blue35};
  }

  &:focus-visible {
    border: 3px solid ${COLORS.blue50};
    background-color: ${COLORS.blue35};

    @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
      background-color: ${COLORS.blue40};
    }
  }
`
