import { useTranslation } from 'react-i18next'

import {
  COLORS,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { SimpleWizardBody } from '/app/molecules/SimpleWizardBody'

import type { ReactNode } from 'react'

interface UnskippableModalProps {
  goBack: () => void
  proceed: () => void
  isRobotMoving: boolean
  isOnDevice: boolean | null
}

export function UnskippableModal(props: UnskippableModalProps): ReactNode {
  const { goBack, proceed, isOnDevice, isRobotMoving } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  return (
    <SimpleWizardBody
      iconColor={COLORS.yellow50}
      header={i18n.format(t('critical_unskippable_step'), 'capitalize')}
      subHeader={t('must_detach_mounting_plate')}
      isSuccess={false}
    >
      {isOnDevice ? (
        <>
          <SmallButton
            marginRight={SPACING.spacing8}
            onClick={proceed}
            buttonText={i18n.format(t('shared:exit'), 'capitalize')}
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
          <PrimaryButton
            variant="warning"
            disabled={isRobotMoving}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            onClick={proceed}
          >
            {t('shared:exit')}
          </PrimaryButton>
        </>
      )}
    </SimpleWizardBody>
  )
}
