import { Trans, useTranslation } from 'react-i18next'

import { LegacyStyledText } from '@opentrons/components'

import { RECOVERY_MAP } from '../constants'
import { CancelRun } from './CancelRun'
import { TwoColTextAndFailedStepNextStep, FillWell } from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'
import { RetrySameTips } from './RetrySameTips'

import type { RecoveryContentProps } from '../types'

export function FillWellAndRetrySameTips(
  props: RecoveryContentProps
): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { MANUAL_FILL_AND_RETRY_SAME_TIPS, CANCEL_RUN } = RECOVERY_MAP

  const buildContent = (): JSX.Element => {
    switch (step) {
      case MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.MANUAL_FILL:
        return <FillWell {...props} />
      case MANUAL_FILL_AND_RETRY_SAME_TIPS.STEPS.RETRY_SAME_TIPS:
        return <RetrySameTips {...props} />
      case CANCEL_RUN.STEPS.CONFIRM_CANCEL:
        return <CancelRun {...props} />
      default:
        console.warn(
          `FillWellAndRetrySameTips: ${step} in ${route} not explicitly handled. Rerouting.`
        )
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}

export function SkipToNextStep(
  props: RecoveryContentProps
): JSX.Element | null {
  const {
    routeUpdateActions,
    recoveryCommands,
    currentRecoveryOptionUtils,
  } = props
  const {
    handleMotionRouting,
    goBackPrevStep,
    proceedToRouteAndStep,
  } = routeUpdateActions
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { skipFailedCommand } = recoveryCommands
  const { ROBOT_SKIPPING_STEP, IGNORE_AND_SKIP } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')

  const secondaryBtnOnClick = (): void => {
    if (selectedRecoveryOption === IGNORE_AND_SKIP.ROUTE) {
      void proceedToRouteAndStep(IGNORE_AND_SKIP.ROUTE)
    } else {
      void goBackPrevStep()
    }
  }

  const primaryBtnOnClick = (): Promise<void> => {
    return handleMotionRouting(true, ROBOT_SKIPPING_STEP.ROUTE).then(() => {
      skipFailedCommand()
    })
  }

  const buildBodyText = (): JSX.Element => {
    return (
      <Trans
        t={t}
        i18nKey="robot_will_not_check_for_liquid"
        components={{
          block: <LegacyStyledText as="p" />,
        }}
      />
    )
  }

  return (
    <TwoColTextAndFailedStepNextStep
      {...props}
      leftColTitle={t('skip_to_next_step')}
      leftColBodyText={buildBodyText()}
      primaryBtnCopy={t('continue_run_now')}
      primaryBtnOnClick={primaryBtnOnClick}
      secondaryBtnOnClickOverride={secondaryBtnOnClick}
    />
  )
}
