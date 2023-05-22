import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { COLORS, PrimaryButton } from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import type { CreateCommand, PipetteMount } from '@opentrons/shared-data'

interface CalibrationErrorModalProps {
  proceed: () => void
  isOnDevice: boolean | null
  errorMessage: string
  chainRunCommands: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean
  ) => Promise<any>
  mount: PipetteMount
}

export function CalibrationErrorModal(
  props: CalibrationErrorModalProps
): JSX.Element {
  const { proceed, isOnDevice, errorMessage, chainRunCommands, mount } = props
  const { t, i18n } = useTranslation(['pipette_wizard_flows', 'shared'])
  const handleProceed = (): void => {
    chainRunCommands(
      [
        {
          // @ts-expect-error calibration type not yet supported
          commandType: 'calibration/moveToMaintenancePosition' as const,
          params: {
            mount: mount,
          },
        },
      ],
      false
    ).then(() => {
      proceed()
    })
  }
  return (
    <SimpleWizardBody
      iconColor={COLORS.errorEnabled}
      header={i18n.format(t('pip_cal_failed'), 'capitalize')}
      subHeader={errorMessage}
      isSuccess={false}
    >
      {isOnDevice ? (
        <SmallButton
          onClick={handleProceed}
          buttonText={i18n.format(t('next'), 'capitalize')}
          buttonType="primary"
        />
      ) : (
        <PrimaryButton onClick={handleProceed}>
          {i18n.format(t('next'), 'capitalize')}
        </PrimaryButton>
      )}
    </SimpleWizardBody>
  )
}
