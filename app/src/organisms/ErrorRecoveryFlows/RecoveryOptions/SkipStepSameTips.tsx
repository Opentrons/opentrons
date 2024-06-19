import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { TwoColTextAndFailedStepNextStep } from '../shared'
import { RECOVERY_MAP } from '../constants'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'

export function SkipStepSameTips(props: RecoveryContentProps): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { SKIP_STEP_WITH_SAME_TIPS } = RECOVERY_MAP

  const buildContent = (): JSX.Element => {
    switch (step) {
      case SKIP_STEP_WITH_SAME_TIPS.STEPS.SKIP:
        return <SkipStepSameTipsInfo {...props} />
      default:
        console.warn(`${step} in ${route} not explicitly handled. Rerouting.`)
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}

function SkipStepSameTipsInfo(props: RecoveryContentProps): JSX.Element {
  const {
    routeUpdateActions,
    recoveryCommands,
    currentRecoveryOptionUtils,
  } = props
  const { skipFailedCommand, resumeRun } = recoveryCommands
  const {
    setRobotInMotion,
    proceedToRouteAndStep,
    goBackPrevStep,
  } = routeUpdateActions
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { ROBOT_SKIPPING_STEP, IGNORE_AND_SKIP } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')

  const primaryBtnOnClick = (): Promise<void> => {
    return setRobotInMotion(true, ROBOT_SKIPPING_STEP.ROUTE)
      .then(() => skipFailedCommand())
      .then(() => {
        resumeRun()
      })
  }

  // TODO(jh, 06-18-24): EXEC-569
  const secondaryBtnOnClick = (): void => {
    if (selectedRecoveryOption === IGNORE_AND_SKIP.ROUTE) {
      void proceedToRouteAndStep(IGNORE_AND_SKIP.ROUTE)
    } else {
      void goBackPrevStep()
    }
  }

  const buildBodyText = (): JSX.Element => {
    return (
      <Trans
        t={t}
        i18nKey="failed_dispense_step_not_completed"
        components={{
          block: <StyledText as="p" />,
        }}
      />
    )
  }

  return (
    <TwoColTextAndFailedStepNextStep
      {...props}
      leftColTitle={t('skip_to_next_step_same_tips')}
      leftColBodyText={buildBodyText()}
      primaryBtnOnClick={primaryBtnOnClick}
      primaryBtnCopy={t('continue_run_now')}
      secondaryBtnOnClickOverride={secondaryBtnOnClick}
    />
  )
}
