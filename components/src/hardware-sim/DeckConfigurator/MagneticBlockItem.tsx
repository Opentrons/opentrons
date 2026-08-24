import { useTranslation } from 'react-i18next'

import { SINGLE_LEFT_CUTOUTS } from '@opentrons/shared-data'

import { StyledText } from '../../atoms/StyledText/StyledText'
import { COLORS } from '../../helix-design-system'
import { Icon } from '../../icons'
import { Btn } from '../../primitives'
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
  Y_ADJUSTMENT,
} from './constants'

import type { ReactNode } from 'react'
import type {
  AddressableAreaNamesWithFakes,
  CutoutFixtureIdsWithFakes,
  CutoutId,
  DeckDefinition,
} from '@opentrons/shared-data'

interface MagneticBlockItemProps {
  deckDefinition: DeckDefinition
  fixtureLocation: CutoutId
  cutoutFixtureId: CutoutFixtureIdsWithFakes
  addressableAreaId: AddressableAreaNamesWithFakes
  handleClickRemove?: (
    fixtureLocation: CutoutId,
    cutoutFixtureId: CutoutFixtureIdsWithFakes,
    addressableAreaId: AddressableAreaNamesWithFakes
  ) => void
  hasStagingArea?: boolean
  selected?: boolean
}

export function MagneticBlockItem(props: MagneticBlockItemProps): ReactNode {
  const { t } = useTranslation('deck_configuration')

  const {
    deckDefinition,
    fixtureLocation,
    handleClickRemove,
    cutoutFixtureId,
    addressableAreaId,
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
    : COLUMN_DEFAULT_SINGLE_SLOT_FIXTURE_WIDTH

  const y = ySlotPosition + Y_ADJUSTMENT

  const editableStyle = selected ? CONFIG_STYLE_SELECTED : CONFIG_STYLE_EDITABLE
  const handleRemoveClick = (): void => {
    if (handleClickRemove != null) {
      handleClickRemove(fixtureLocation, cutoutFixtureId, addressableAreaId)
    }
  }
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
        onClick={handleRemoveClick}
        height="100%"
        data-testid={addressableAreaId}
      >
        <StyledText
          oddStyle="smallBodyTextSemiBold"
          desktopStyle="bodyDefaultSemiBold"
          css={TYPOGRAPHY.smallBodyTextSemiBold}
        >
          {t('mag_block')}
        </StyledText>
        {handleClickRemove != null ? (
          <Icon name="remove" color={COLORS.white} size="2rem" />
        ) : null}
      </Btn>
    </RobotCoordsForeignObject>
  )
}
