import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Btn, Text } from '../../primitives'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  COLUMN_DEFAULT_X_ADJUSTMENT,
  CONFIG_STYLE_EDITABLE,
  CONFIG_STYLE_READ_ONLY,
  CONFIG_STYLE_SELECTED,
  FIXTURE_HEIGHT,
  COLUMN_DEFAULT_SINGLE_SLOT_FIXTURE_WIDTH,
  Y_ADJUSTMENT,
} from './constants'

import type {
  AddressableArea,
  AddressableAreaName,
  CutoutFixtureId,
  CutoutId,
  DeckDefinition,
} from '@opentrons/shared-data'

interface FlexStackerFixtureProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  cutoutFixtureId: CutoutFixtureId
  hasWasteChute: boolean
  handleClickRemove?: (
    fixtureLocation: CutoutId,
    cutoutFixtureId: CutoutFixtureId
  ) => void
  selected?: boolean
  addressableArea: AddressableAreaName
}

// todo(should we move this to translations? )
const FLEX_STACKER_FIXTURE_DISPLAY_NAME = 'Stacker'
const FLEX_STACKER_WASTE_CHUTE_DISPLAY_NAME = 'Stacker + Waste chute'
const FLEX_STACKER_MAG_BLOCK_DISPLAY_NAME = 'Stacker + Mag Block'

export function FlexStackerFixture(
  props: FlexStackerFixtureProps
): JSX.Element {
  const {
    deckDefinition,
    handleClickRemove,
    fixtureLocation,
    cutoutFixtureId,
    hasWasteChute,
    addressableArea,
    selected = false,
  } = props

  const cutoutDef = deckDefinition.locations.cutouts.find(
    cutout => cutout.id === fixtureLocation
  )
  let displayName = FLEX_STACKER_FIXTURE_DISPLAY_NAME
  if (hasWasteChute) {
    displayName = FLEX_STACKER_WASTE_CHUTE_DISPLAY_NAME
  } else if (cutoutFixtureId === 'flexStackerModuleV1WithMagneticBlockV1') {
    displayName = FLEX_STACKER_MAG_BLOCK_DISPLAY_NAME
  }

  /**
   * deck definition cutout position is the position of the single slot located within that cutout
   * so, to get the position of the cutout itself we must add an adjustment to the slot position
   * the adjustment for x is different for right side/left side
   */
  const [xSlotPosition = 0, ySlotPosition = 0] = cutoutDef?.position ?? []
  const offsetVector = deckDefinition.locations.addressableAreas.find(
    (aaItem: AddressableArea) => aaItem.id === addressableArea
  )?.offsetFromCutoutFixture ?? [0, 0, 0]
  const y = ySlotPosition + Y_ADJUSTMENT
  const x = xSlotPosition + offsetVector[0] + COLUMN_DEFAULT_X_ADJUSTMENT

  const editableStyle = selected ? CONFIG_STYLE_SELECTED : CONFIG_STYLE_EDITABLE
  return (
    <RobotCoordsForeignObject
      width={COLUMN_DEFAULT_SINGLE_SLOT_FIXTURE_WIDTH}
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
