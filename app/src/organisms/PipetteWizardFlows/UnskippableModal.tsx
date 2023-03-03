import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'
import { AlertPrimaryButton } from '../../atoms/buttons'
import { AlertSmallButton } from '../../atoms/buttons/ODD'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { StyledText } from '../../atoms/text'

interface UnskippableModalProps {
  goBack: () => void
  isOnDevice: boolean | null
}

export function UnskippableModal(props: UnskippableModalProps): JSX.Element {
  const { goBack, isOnDevice } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  return (
    <SimpleWizardBody
      iconColor={COLORS.warningEnabled}
      header={t('critical_unskippable_step')}
      subHeader={t('must_detach_mounting_plate')}
      isSuccess={false}
    >
      {isOnDevice ? (
        <AlertSmallButton onClick={goBack} aria-label="isOnDevice_button">
          <StyledText
            fontSize="1.375rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            padding={SPACING.spacing4}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
          >
            {t('shared:return')}
          </StyledText>
        </AlertSmallButton>
      ) : (
        <AlertPrimaryButton
          onClick={goBack}
          textTransform={TEXT_TRANSFORM_CAPITALIZE}
        >
          {t('shared:return')}
        </AlertPrimaryButton>
      )}
    </SimpleWizardBody>
  )
}
