import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS, PrimaryButton } from '@opentrons/components'

import {
  SimpleWizardBody,
  SimpleWizardInProgressBody,
} from '/app/molecules/SimpleWizardBody'

import { startCalibrationOnClick } from './utils'

import type { PipetteWizardStepProps } from './types'

export const RemoveWasteChute = (
  props: PipetteWizardStepProps
): JSX.Element | null => {
  const { attachedPipettes, mount } = props
  const { isRobotMoving, errorMessage } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])
  const [, setShowUnableToDetect] = useState<boolean>(false)
  const pipetteId = attachedPipettes[mount]?.serialNumber
  if (pipetteId == null) return null

  const startCalibration = startCalibrationOnClick(
    props,
    setShowUnableToDetect,
    pipetteId
  )
  if (isRobotMoving) {
    return <SimpleWizardInProgressBody description={t('stand_back')} />
  }

  return errorMessage != null ? (
    <SimpleWizardBody
      iconColor={COLORS.red50}
      header={t('shared:error_encountered')}
      isSuccess={false}
      subHeader={errorMessage}
    />
  ) : (
    <SimpleWizardBody
      header={t('waste_chute_error')}
      subHeader={t('waste_chute_warning')}
      iconColor={COLORS.yellow50}
      isSuccess={false}
    >
      <PrimaryButton onClick={startCalibration}>
        {t('begin_calibration')}
      </PrimaryButton>
    </SimpleWizardBody>
  )
}
