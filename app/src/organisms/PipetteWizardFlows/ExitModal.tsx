import * as React from 'react'
import capitalize from 'lodash/capitalize'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  SPACING,
  Flex,
  TYPOGRAPHY,
  SecondaryButton,
  AlertPrimaryButton,
} from '@opentrons/components'
import { SmallButton } from '../../atoms/buttons'
import { InProgressModal } from '../../molecules/InProgressModal/InProgressModal'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { FLOWS } from './constants'
import type { PipetteWizardFlow } from './types'

interface ExitModalProps {
  isRobotMoving?: boolean
  proceed: () => void
  goBack: () => void
  flowType: PipetteWizardFlow
  isOnDevice: boolean
}

export function ExitModal(props: ExitModalProps): JSX.Element {
  const { goBack, proceed, flowType, isOnDevice, isRobotMoving } = props
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
  if (isRobotMoving) return <InProgressModal description={t('stand_back')} />

  return (
    <SimpleWizardBody
      iconColor={COLORS.warningEnabled}
      header={t('progress_will_be_lost', { flow: flowTitle })}
      subHeader={t('are_you_sure_exit', { flow: flowTitle })}
      isSuccess={false}
    >
      {isOnDevice ? (
        <>
          <Flex marginRight={SPACING.spacing8}>
            <SmallButton
              onClick={proceed}
              buttonText={capitalize(t('shared:exit'))}
              buttonType="alert"
            />
          </Flex>
          <SmallButton buttonText={t('shared:go_back')} onClick={goBack} />
        </>
      ) : (
        <>
          <SecondaryButton onClick={goBack} marginRight={SPACING.spacing4}>
            {t('shared:go_back')}
          </SecondaryButton>
          <AlertPrimaryButton
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
