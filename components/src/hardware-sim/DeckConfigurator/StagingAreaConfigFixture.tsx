import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Btn, Text } from '../../primitives'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  COLUMN_3_X_ADJUSTMENT,
  COLUMN_4_AA,
  CONFIG_STYLE_EDITABLE,
  CONFIG_STYLE_READ_ONLY,
  CONFIG_STYLE_SELECTED,
  FIXTURE_HEIGHT,
  STAGING_AREA_DISPLAY_NAME,
  STAGING_AREA_FIXTURE_WIDTH,
  Y_ADJUSTMENT,
} from './constants'

import type {
  AddressableArea,
  AddressableAreaName,
  CutoutFixtureId,
  CutoutId,
  DeckDefinition,
} from '@opentrons/shared-data'

interface StagingAreaConfigFixtureProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  cutoutFixtureId: CutoutFixtureId
  addressableArea: AddressableAreaName
  handleClickRemove?: (
    fixtureLocation: CutoutId,
    cutoutFixtureId: CutoutFixtureId
  ) => void
  selected?: boolean
}

export function StagingAreaConfigFixture(
  props: StagingAreaConfigFixtureProps
): JSX.Element {
  const {
    deckDefinition,
    handleClickRemove,
    fixtureLocation,
    cutoutFixtureId,
    addressableArea,
    selected = false,
  } = props

  console.log("addressableArea: ", addressableArea)

  const stagingAreaCutout = deckDefinition.locations.cutouts.find(
    cutout => cutout.id === fixtureLocation
  )
  const OffsetVector = deckDefinition.locations.addressableAreas.find((aaItem: AddressableArea) => aaItem.id === addressableArea)?.offsetFromCutoutFixture ?? [0, 0, 0]
  const xOffset = COLUMN_4_AA.includes(addressableArea) ? OffsetVector[0]: 0
  console.log("xOffset: ", xOffset)
  /**
   * deck definition cutout position is the position of the single slot located within that cutout
   * so, to get the position of the cutout itself we must add an adjustment to the slot position
   */
  const [xSlotPosition = 0, ySlotPosition = 0] =
    stagingAreaCutout?.position ?? []

  const x = xSlotPosition + COLUMN_3_X_ADJUSTMENT + xOffset
  const y = ySlotPosition + Y_ADJUSTMENT

  const editableStyle = selected ? CONFIG_STYLE_SELECTED : CONFIG_STYLE_EDITABLE
  return (
    <RobotCoordsForeignObject
      width={STAGING_AREA_FIXTURE_WIDTH}
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
        <Text css={TYPOGRAPHY.smallBodyTextSemiBold}>
          {STAGING_AREA_DISPLAY_NAME}
        </Text>
        {handleClickRemove != null ? (
          <Icon name="remove" color={COLORS.white} size="2rem" />
        ) : null}
      </Btn>
    </RobotCoordsForeignObject>
  )
}
