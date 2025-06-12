import { css } from 'styled-components'

import {
  getAALocationForCutoutAndFixtureId,
  SINGLE_LEFT_CUTOUTS,
} from '@opentrons/shared-data'

import { BORDERS, COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Btn } from '../../primitives'
import { ALIGN_CENTER, DISPLAY_FLEX, JUSTIFY_CENTER } from '../../styles'
import { RESPONSIVENESS } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  COLUMN_1_SINGLE_SLOT_FIXTURE_WIDTH,
  COLUMN_1_X_ADJUSTMENT,
  COLUMN_DEFAULT_SINGLE_SLOT_FIXTURE_WIDTH,
  COLUMN_DEFAULT_X_ADJUSTMENT,
  FIXTURE_HEIGHT,
  Y_ADJUSTMENT,
} from './constants'

import type {
  AddressableAreaNamesWithFakes,
  CutoutId,
  DeckDefinition,
} from '@opentrons/shared-data'

interface EmptyConfigItemProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  addressableArea: AddressableAreaNamesWithFakes
  handleClickAdd: (fixtureLocation: CutoutId) => void
}

export function EmptyConfigItem(props: EmptyConfigItemProps): JSX.Element {
  const {
    deckDefinition,
    handleClickAdd,
    fixtureLocation,
    addressableArea,
  } = props

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
  const offsetVector = getAALocationForCutoutAndFixtureId(
    addressableArea,
    deckDefinition
  )

  const x =
    xSlotPosition +
    (SINGLE_LEFT_CUTOUTS.includes(fixtureLocation)
      ? COLUMN_1_X_ADJUSTMENT
      : COLUMN_DEFAULT_X_ADJUSTMENT) +
    offsetVector[0]
  const width = SINGLE_LEFT_CUTOUTS.includes(fixtureLocation)
    ? COLUMN_1_SINGLE_SLOT_FIXTURE_WIDTH
    : COLUMN_DEFAULT_SINGLE_SLOT_FIXTURE_WIDTH
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
        data-testid={addressableArea}
      >
        <Icon name="add-circle" color={COLORS.blue50} size="2rem" />
      </Btn>
    </RobotCoordsForeignObject>
  )
}

const EMPTY_CONFIG_STYLE = css`
  display: ${DISPLAY_FLEX};
  align-items: ${ALIGN_CENTER};
  justify-content: ${JUSTIFY_CENTER};
  background-color: ${COLORS.blue30};
  border: 4px dashed ${COLORS.blue50};
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
