import { useTranslation } from 'react-i18next'

import { COLORS, JUSTIFY_FLEX_END, PrimaryButton } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import { startCalibrationOnClick } from './utils'

import type { PipetteWizardStepProps } from './types'

export const RemoveWasteChute = (
  props: PipetteWizardStepProps
): JSX.Element | null => {
  const { attachedPipettes, mount, isOnDevice, isRobotMoving } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  const pipetteId = attachedPipettes[mount]?.serialNumber
  if (pipetteId == null) return null

  const startCalibration = startCalibrationOnClick(props, pipetteId)
  if (isRobotMoving) {
    return <SimpleWizardInProgressBody description={t('stand_back')} />
  }

  return (
    <SimpleWizardBody
      justifyContentForOddButton={JUSTIFY_FLEX_END}
      header={t('waste_chute_error')}
      subHeader={t('waste_chute_warning')}
      iconColor={COLORS.yellow50}
      isSuccess={false}
    >
      {isOnDevice ? (
        <SmallButton
          buttonType="primary"
          onClick={startCalibration}
          buttonText={t('begin_calibration')}
        />
      ) : (
        <PrimaryButton onClick={startCalibration}>
          {t('begin_calibration')}
        </PrimaryButton>
      )}
    </SimpleWizardBody>
  )
}
