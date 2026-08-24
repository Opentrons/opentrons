import { useTranslation } from 'react-i18next'

import { getAALocationForCutoutAndFixtureId } from '@opentrons/shared-data'

import { StyledText } from '../../atoms/StyledText/StyledText'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Btn } from '../../primitives'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  COLUMN_DEFAULT_SINGLE_SLOT_FIXTURE_WIDTH,
  CONFIG_STYLE_EDITABLE,
  CONFIG_STYLE_READ_ONLY,
  CONFIG_STYLE_SELECTED,
  FIXTURE_HEIGHT,
  STACKER_X_ADJUSTMENT,
  Y_ADJUSTMENT,
} from './constants'

import type { ReactNode } from 'react'
import type {
  AddressableAreaNamesWithFakes,
  CutoutFixtureIdsWithFakes,
  CutoutId,
  DeckCutout,
  DeckDefinition,
} from '@opentrons/shared-data'

interface FlexStackerItemProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  cutoutFixtureId: CutoutFixtureIdsWithFakes
  addressableAreaId: AddressableAreaNamesWithFakes
  hasWasteChute: boolean
  handleClickRemove?: (
    fixtureLocation: CutoutId,
    cutoutFixtureId: CutoutFixtureIdsWithFakes,
    addressableAreaId: AddressableAreaNamesWithFakes
  ) => void
  selected?: boolean
}

export function FlexStackerItem(props: FlexStackerItemProps): ReactNode {
  const {
    deckDefinition,
    handleClickRemove,
    fixtureLocation,
    cutoutFixtureId,
    hasWasteChute,
    addressableAreaId,
    selected = false,
  } = props

  const { t } = useTranslation('deck_configuration')
  const cutoutDef = deckDefinition.locations.cutouts.find(
    (cutout: DeckCutout) => cutout.id === fixtureLocation
  )
  let displayName = t('flex_stacker_display_name')
  if (hasWasteChute) {
    displayName = t('flex_stacker_waste_chute_display_name')
  }

  /**
   * deck definition cutout position is the position of the single slot located within that cutout
   * so, to get the position of the cutout itself we must add an adjustment to the slot position
   * the adjustment for x is different for right side/left side
   */
  const [xSlotPosition = 0, ySlotPosition = 0] = cutoutDef?.position ?? []
  const offsetVector = getAALocationForCutoutAndFixtureId(
    addressableAreaId,
    deckDefinition
  )
  const y = ySlotPosition + Y_ADJUSTMENT
  const x = xSlotPosition + offsetVector[0] + STACKER_X_ADJUSTMENT

  const editableStyle = selected ? CONFIG_STYLE_SELECTED : CONFIG_STYLE_EDITABLE
  const handleRemoveClick = (): void => {
    if (handleClickRemove != null) {
      handleClickRemove(fixtureLocation, cutoutFixtureId, addressableAreaId)
    }
  }
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
        onClick={handleRemoveClick}
        height="100%"
      >
        <StyledText
          oddStyle="smallBodyTextSemiBold"
          desktopStyle="bodyDefaultSemiBold"
          css={TYPOGRAPHY.smallBodyTextSemiBold}
        >
          {displayName}
        </StyledText>
        {handleClickRemove != null ? (
          <Icon name="remove" color={COLORS.white} size="2rem" />
        ) : null}
      </Btn>
    </RobotCoordsForeignObject>
  )
}
