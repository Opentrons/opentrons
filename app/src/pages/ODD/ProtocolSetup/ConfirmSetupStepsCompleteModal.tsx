import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { SmallButton } from '/app/components/ODD/buttons'
import { OddModal } from '/app/components/ODD/modals/OddModal'
import { LPC_STEP_KEY, STEP_KEY_TO_I18N_KEY } from '/app/redux/protocol-runs'

import type { ReactNode } from 'react'
import type { OddModalHeaderBaseProps } from '/app/components/ODD/modals/OddModal/types'
import type { StepKey } from '/app/redux/protocol-runs'

interface ConfirmSetupStepsCompleteModalProps {
  onCloseClick: () => void
  onConfirmClick: () => void
  missingSteps: StepKey[]
  isRunStarting: boolean
}

export function ConfirmSetupStepsCompleteModal({
  onCloseClick,
  missingSteps,
  onConfirmClick,
  isRunStarting,
}: ConfirmSetupStepsCompleteModalProps): ReactNode {
  const { i18n, t } = useTranslation(['protocol_setup', 'shared'])
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('are_you_sure_you_want_to_proceed'),
    hasExitIcon: true,
  }

  const handleStartRun = (): void => {
    onConfirmClick()
    onCloseClick()
  }

  const isMissingLPCStep = missingSteps.includes(LPC_STEP_KEY)

  const buildMissingStepsCopy = (): string => {
    const formattedSteps = new Intl.ListFormat('en', {
      style: 'short',
      type: 'conjunction',
    }).format(missingSteps.map(step => t(STEP_KEY_TO_I18N_KEY[step])))

    const i18nKey = isMissingLPCStep
      ? 'you_havent_confirmed_lpc_missing'
      : 'you_havent_confirmed'
    return t(i18nKey, { missingSteps: formattedSteps })
  }

  return (
    <OddModal header={modalHeader} onOutsideClick={onCloseClick}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <StyledText forwardedAs="p">{buildMissingStepsCopy()}</StyledText>
        <Flex gridGap={SPACING.spacing8}>
          <SmallButton
            flex="1"
            buttonType="secondary"
            buttonText={i18n.format(t('shared:go_back'), 'capitalize')}
            onClick={() => {
              onCloseClick()
            }}
          />
          <SmallButton
            flex="1"
            buttonType="primary"
            buttonText={t('start_run')}
            onClick={handleStartRun}
            iconName={isRunStarting ? 'ot-spinner' : undefined}
            iconPlacement={isRunStarting ? 'startIcon' : undefined}
          />
        </Flex>
      </Flex>
    </OddModal>
  )
}
