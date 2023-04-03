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
import { SmallButton } from '../../atoms/buttons/OnDeviceDisplay'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { FLOWS } from './constants'
import type { PipetteWizardFlow } from './types'

interface ExitModalProps {
  proceed: () => void
  goBack: () => void
  flowType: PipetteWizardFlow
  isOnDevice: boolean | null
}

export function ExitModal(props: ExitModalProps): JSX.Element {
  const { goBack, proceed, flowType, isOnDevice } = props
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
      {isOnDevice ? (
        <>
          <Flex marginRight={SPACING.spacing3}>
            <SmallButton
              onClick={proceed}
              buttonText={capitalize(t('shared:exit'))}
              buttonType="alert"
            />
          </Flex>
          <SmallButton
            buttonText={t('shared:go_back')}
            buttonType="default"
            onClick={goBack}
          />
        </>
      ) : (
        <>
          <SecondaryButton onClick={goBack} marginRight={SPACING.spacing2}>
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
