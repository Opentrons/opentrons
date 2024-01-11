import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  LEGACY_COLORS,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SecondaryButton,
  AlertPrimaryButton,
} from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'

interface UnskippableModalProps {
  goBack: () => void
  proceed: () => void
  isRobotMoving: boolean
  isOnDevice: boolean | null
}

export function UnskippableModal(props: UnskippableModalProps): JSX.Element {
  const { goBack, proceed, isOnDevice, isRobotMoving } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  return (
    <SimpleWizardBody
      iconColor={LEGACY_COLORS.warningEnabled}
      header={i18n.format(t('critical_unskippable_step'), 'capitalize')}
      subHeader={t('must_detach_mounting_plate')}
      isSuccess={false}
    >
      {isOnDevice ? (
        <>
          <SmallButton
            marginRight={SPACING.spacing8}
            onClick={proceed}
            buttonText={t('shared:exit')}
            buttonType="alert"
            disabled={isRobotMoving}
          />

          <SmallButton
            disabled={isRobotMoving}
            buttonText={t('shared:go_back')}
            onClick={goBack}
          />
        </>
      ) : (
        <>
          <SecondaryButton
            disabled={isRobotMoving}
            onClick={goBack}
            marginRight={SPACING.spacing4}
          >
            {t('shared:go_back')}
          </SecondaryButton>
          <AlertPrimaryButton
            disabled={isRobotMoving}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            onClick={proceed}
          >
            {t('shared:exit')}
          </AlertPrimaryButton>
        </>
      )}
    </SimpleWizardBody>
  )
}
