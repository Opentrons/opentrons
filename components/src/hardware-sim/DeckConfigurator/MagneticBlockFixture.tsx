import { Icon } from '../../icons'
import { Btn, Text } from '../../primitives'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { COLORS } from '../../helix-design-system'
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
  CONFIG_STYLE_EDITABLE,
  CONFIG_STYLE_READ_ONLY,
  STAGING_AREA_FIXTURE_WIDTH,
  CONFIG_STYLE_SELECTED,
} from './constants'

import type {
  CutoutFixtureId,
  CutoutId,
  DeckDefinition,
} from '@opentrons/shared-data'

interface MagneticBlockFixtureProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  cutoutFixtureId: CutoutFixtureId
  handleClickRemove?: (
    fixtureLocation: CutoutId,
    cutoutFixtureId: CutoutFixtureId
  ) => void
  hasStagingArea?: boolean
  selected?: boolean
}

const MAGNETIC_BLOCK_FIXTURE_DISPLAY_NAME = 'Mag Block'
const STAGING_AREA_WITH_MAGNETIC_BLOCK_DISPLAY_NAME = 'Mag + staging'

export function MagneticBlockFixture(
  props: MagneticBlockFixtureProps
): JSX.Element {
  const {
    deckDefinition,
    fixtureLocation,
    handleClickRemove,
    cutoutFixtureId,
    hasStagingArea,
    selected = false,
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
  let x = xSlotPosition
  let width = 0
  let displayName = hasStagingArea
    ? STAGING_AREA_WITH_MAGNETIC_BLOCK_DISPLAY_NAME
    : MAGNETIC_BLOCK_FIXTURE_DISPLAY_NAME
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
      displayName = 'Mag'
      break
    }
    case 'cutoutA3':
    case 'cutoutB3':
    case 'cutoutC3':
    case 'cutoutD3': {
      x = xSlotPosition + COLUMN_3_X_ADJUSTMENT
      width = hasStagingArea
        ? STAGING_AREA_FIXTURE_WIDTH
        : COLUMN_3_SINGLE_SLOT_FIXTURE_WIDTH
      break
    }
  }

  const y = ySlotPosition + Y_ADJUSTMENT

  const editableStyle = selected ? CONFIG_STYLE_SELECTED : CONFIG_STYLE_EDITABLE
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
        css={handleClickRemove != null ? editableStyle : CONFIG_STYLE_READ_ONLY}
        cursor={handleClickRemove != null ? 'pointer' : 'default'}
        onClick={
          handleClickRemove != null
            ? () => {
                handleClickRemove(fixtureLocation, cutoutFixtureId)
              }
            : () => {}
        }
      >
        <Text css={TYPOGRAPHY.smallBodyTextSemiBold}>{displayName}</Text>
        {handleClickRemove != null ? (
          <Icon name="remove" color={COLORS.white} size="2rem" />
        ) : null}
      </Btn>
    </RobotCoordsForeignObject>
  )
}
