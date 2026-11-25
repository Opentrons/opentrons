import { useTranslation } from 'react-i18next'

import { DEFAULT_AA_FOR_WASTE_CHUTE } from '@opentrons/shared-data'

import { StyledText } from '../../atoms/StyledText/StyledText'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Btn } from '../../primitives'
import { TYPOGRAPHY } from '../../ui-style-constants'
import { RobotCoordsForeignObject } from '../Deck/RobotCoordsForeignObject'
import {
  COLUMN_DEFAULT_SINGLE_SLOT_FIXTURE_WIDTH,
  COLUMN_DEFAULT_X_ADJUSTMENT,
  CONFIG_STYLE_EDITABLE,
  CONFIG_STYLE_READ_ONLY,
  CONFIG_STYLE_SELECTED,
  FIXTURE_HEIGHT,
  Y_ADJUSTMENT,
} from './constants'

import type { ReactNode } from 'react'
import type {
  AddressableAreaNamesWithFakes,
  CutoutFixtureIdsWithFakes,
  CutoutId,
  DeckDefinition,
} from '@opentrons/shared-data'

interface WasteChuteConfigItemProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  cutoutFixtureId: CutoutFixtureIdsWithFakes
  handleClickRemove?: (
    fixtureLocation: CutoutId,
    cutoutFixtureId: CutoutFixtureIdsWithFakes,
    addressableAreaId: AddressableAreaNamesWithFakes
  ) => void
  hasStagingAreas?: boolean
  selected?: boolean
}

export function WasteChuteConfigFixture(
  props: WasteChuteConfigItemProps
): ReactNode {
  const { t } = useTranslation('deck_configuration')

  const {
    deckDefinition,
    handleClickRemove,
    fixtureLocation,
    cutoutFixtureId,
    selected = false,
  } = props

  const wasteChuteCutout = deckDefinition.locations.cutouts.find(
    cutout => cutout.id === fixtureLocation
  )

  /**
   * deck definition cutout position is the position of the single slot located within that cutout
   * so, to get the position of the cutout itself we must add an adjustment to the slot position
   */
  const [xSlotPosition = 0, ySlotPosition = 0] =
    wasteChuteCutout?.position ?? []

  const x = xSlotPosition + COLUMN_DEFAULT_X_ADJUSTMENT
  const y = ySlotPosition + Y_ADJUSTMENT

  const editableStyle = selected ? CONFIG_STYLE_SELECTED : CONFIG_STYLE_EDITABLE
  const handleRemoveClick = (): void => {
    if (handleClickRemove != null) {
      handleClickRemove(
        fixtureLocation,
        cutoutFixtureId,
        DEFAULT_AA_FOR_WASTE_CHUTE
      )
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
          {t('waste')}
        </StyledText>

        {handleClickRemove != null ? (
          <Icon name="remove" color={COLORS.white} size="2rem" />
        ) : null}
      </Btn>
    </RobotCoordsForeignObject>
  )
}
