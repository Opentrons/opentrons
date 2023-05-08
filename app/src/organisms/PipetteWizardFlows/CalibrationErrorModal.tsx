import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS, PrimaryButton } from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'

interface CalibrationErrorModalProps {
  proceed: () => void
  isOnDevice: boolean | null
  errorMessage: string
}

export function CalibrationErrorModal(
  props: CalibrationErrorModalProps
): JSX.Element {
  const { proceed, isOnDevice, errorMessage } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  return (
    <SimpleWizardBody
      iconColor={COLORS.errorEnabled}
      header={i18n.format(t('error_calibrating_pipette'), 'capitalize')}
      subHeader={errorMessage}
      isSuccess={false}
    >
      {isOnDevice ? (
        <SmallButton
          onClick={proceed}
          buttonText={i18n.format(t('next'), 'capitalize')}
          buttonType="primary"
        />
      ) : (
        <PrimaryButton onClick={proceed}>
          {i18n.format(t('next'), 'capitalize')}
        </PrimaryButton>
      )}
    </SimpleWizardBody>
  )
}
