import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { AlertPrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { FLOWS } from './constants'
import type { PipetteWizardFlow } from './types'

interface ExitModalProps {
  proceed: () => void
  goBack: () => void
  flowType: PipetteWizardFlow
}

export function ExitModal(props: ExitModalProps): JSX.Element {
  const { goBack, proceed, flowType } = props
  const { t } = useTranslation(['pipette_wizard_flows', 'shared'])

  let flowTitle: string = t('pipette_calibration')
  switch (flowType) {
    case FLOWS.ATTACH: {
      flowTitle = t('attach')
      break
    }
    case FLOWS.DETACH: {
      flowTitle = t('detach')
      break
    }
  }

  return (
    <SimpleWizardBody
      iconColor={COLORS.warningEnabled}
      header={t('progress_will_be_lost', { flow: flowTitle })}
      subHeader={t('are_you_sure_exit', { flow: flowTitle })}
      isSuccess={false}
    >
      <SecondaryButton onClick={goBack} marginRight={SPACING.spacing2}>
        {t('shared:go_back')}
      </SecondaryButton>
      <AlertPrimaryButton
        textTransform={TEXT_TRANSFORM_CAPITALIZE}
        onClick={proceed}
      >
        {t('shared:exit')}
      </AlertPrimaryButton>
    </SimpleWizardBody>
  )
}
