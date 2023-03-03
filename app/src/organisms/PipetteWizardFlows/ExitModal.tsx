import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
} from '@opentrons/components'
import { SmallButton, AlertSmallButton } from '../../atoms/buttons/ODD'
import { AlertPrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { SimpleWizardBody } from '../../molecules/SimpleWizardBody'
import { StyledText } from '../../atoms/text'
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
          <SmallButton
            onClick={goBack}
            aria-label="isOnDevice_goBack"
            marginRight={SPACING.spacing6}
          >
            <StyledText
              fontSize="1.375rem"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              padding={SPACING.spacing4}
              textTransform={TEXT_TRANSFORM_CAPITALIZE}
            >
              {t('shared:go_back')}
            </StyledText>
          </SmallButton>
          <AlertSmallButton onClick={proceed} aria-label="isOnDevice_exit">
            <StyledText
              fontSize="1.375rem"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              padding={SPACING.spacing4}
              textTransform={TEXT_TRANSFORM_CAPITALIZE}
            >
              {t('shared:exit')}
            </StyledText>
          </AlertSmallButton>
        </>
      ) : (
        <>
          <SecondaryButton onClick={goBack} marginRight={SPACING.spacing2}>
            {t('shared:go_back')}
          </SecondaryButton>
          <AlertPrimaryButton
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            onClick={proceed}
          >
            {t('shared:exit')}
          </AlertPrimaryButton>
        </>
      )}
    </SimpleWizardBody>
  )
}
