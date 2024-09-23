import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
  StyledText,
} from '@opentrons/components'
import { getDeckDefFromRobotType } from '@opentrons/shared-data'

import { TwoColumn, DeckMapContent } from '../../../molecules/InterventionModal'
import { CHOOSE_BLOWOUT_LOCATION } from '../constants'
import { DropTipFooterButtons } from '../shared'

import type { ModuleLocation } from '@opentrons/shared-data'
import type { DropTipWizardContainerProps } from '../types'

export const ChooseLocation = ({
  robotType,
  dropTipCommands,
  proceedWithConditionalClose,
  goBackRunValid,
  currentStep,
  isOnDevice,
}: DropTipWizardContainerProps): JSX.Element | null => {
  const { moveToAddressableArea } = dropTipCommands
  const { t } = useTranslation('drop_tip_wizard')
  const [
    selectedLocation,
    setSelectedLocation,
  ] = React.useState<ModuleLocation>()
  const deckDef = getDeckDefFromRobotType(robotType)

  const handleConfirmPosition = (): void => {
    const deckSlot = deckDef.locations.addressableAreas.find(
      l => l.id === selectedLocation?.slotName
    )?.id

    if (deckSlot != null) {
      void moveToAddressableArea(deckSlot).then(() => {
        proceedWithConditionalClose()
      })
    }
  }

  const buildTitleText = (): string =>
    currentStep === CHOOSE_BLOWOUT_LOCATION
      ? t('choose_blowout_location')
      : t('choose_drop_tip_location')

  const buildBodyText = (): string => {
    if (currentStep === CHOOSE_BLOWOUT_LOCATION) {
      return isOnDevice ? 'select_blowout_slot_odd' : 'select_blowout_slot'
    } else {
      return isOnDevice ? 'select_drop_tip_slot_odd' : 'select_drop_tip_slot'
    }
  }

  return (
    <>
      <TwoColumn>
        <Flex flexDirection={DIRECTION_COLUMN} flex="1" gap={SPACING.spacing16}>
          <StyledText
            desktopStyle="headingSmallBold"
            oddStyle="level4HeaderSemiBold"
          >
            {buildTitleText()}
          </StyledText>
          <StyledText>
            <Trans
              t={t}
              i18nKey={buildBodyText()}
              components={{ block: <LegacyStyledText as="p" /> }}
            />
          </StyledText>
        </Flex>
        <DeckMapContent
          kind={'deck-config'}
          setSelectedLocation={setSelectedLocation}
          robotType={robotType}
        />
      </TwoColumn>
      <DropTipFooterButtons
        primaryBtnOnClick={handleConfirmPosition}
        primaryBtnTextOverride={t('move_to_slot')}
        secondaryBtnOnClick={goBackRunValid}
      />
    </>
  )
}
