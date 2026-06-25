import { i18n } from '/app/i18n'

import type { TFunction } from 'i18next'
import type { PipetteWizardFlowAction } from '@opentrons/react-api-client/src/accessControl/types'

export const PipetteFlowActionText = ({
  action,
  t,
  className,
}: {
  action: PipetteWizardFlowAction
  t: TFunction
  className?: string
}): JSX.Element => {
  const { flowType, pipette, mount, pipetteInfo, step } = action
  const mountName = mount === 'left' ? t('left_mount') : t('right_mount')
  const flowTypeText =
    flowType === 'ATTACH'
      ? t('attach')
      : flowType === 'DETACH'
        ? t('detach')
        : t('calibrate')
  const pipetteCategoryText =
    pipette === '96-Channel'
      ? t('96_channel')
      : t('single_channel_and_8_channel')

  const pipetteNameText = pipetteInfo?.displayName

  const endText = step === 'end' ? t('end') + ' ' : ''

  const text =
    endText +
    t('pipette_wizard_flow', {
      flowtype: endText ? i18n.format(flowTypeText, 'lowerCase') : flowTypeText,
      pipette: pipetteNameText || pipetteCategoryText,
      mount: mountName,
    })

  return <div className={className}>{text}</div>
}
