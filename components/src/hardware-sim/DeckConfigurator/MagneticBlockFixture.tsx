import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Btn, Text } from '../../primitives'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  COLUMN_1_SINGLE_SLOT_FIXTURE_WIDTH,
  COLUMN_1_X_ADJUSTMENT,
  COLUMN_DEFAULT_SINGLE_SLOT_FIXTURE_WIDTH,
  COLUMN_DEFAULT_X_ADJUSTMENT,
  CONFIG_STYLE_EDITABLE,
  CONFIG_STYLE_READ_ONLY,
  CONFIG_STYLE_SELECTED,
  FIXTURE_HEIGHT,
  STAGING_AREA_FIXTURE_WIDTH,
  Y_ADJUSTMENT,
} from './constants'

import {
  SINGLE_LEFT_CUTOUTS,
  SINGLE_RIGHT_CUTOUTS,
  type CutoutFixtureId,
  type CutoutId,
  type DeckDefinition,
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
  const x =
      xSlotPosition +
      (SINGLE_LEFT_CUTOUTS.includes(fixtureLocation)
        ? COLUMN_1_X_ADJUSTMENT
        : COLUMN_DEFAULT_X_ADJUSTMENT)
  const width = SINGLE_LEFT_CUTOUTS.includes(fixtureLocation)
      ? COLUMN_1_SINGLE_SLOT_FIXTURE_WIDTH
      : (SINGLE_RIGHT_CUTOUTS.includes(fixtureLocation) ? (hasStagingArea ?? true
        ? STAGING_AREA_FIXTURE_WIDTH
        : COLUMN_DEFAULT_SINGLE_SLOT_FIXTURE_WIDTH) : COLUMN_DEFAULT_SINGLE_SLOT_FIXTURE_WIDTH)

  let displayName = hasStagingArea
    ? STAGING_AREA_WITH_MAGNETIC_BLOCK_DISPLAY_NAME
    : MAGNETIC_BLOCK_FIXTURE_DISPLAY_NAME

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
