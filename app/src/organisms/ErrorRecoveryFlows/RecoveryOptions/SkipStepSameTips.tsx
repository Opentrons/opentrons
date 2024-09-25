import { Trans, useTranslation } from 'react-i18next'

import { LegacyStyledText } from '@opentrons/components'

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

export function SkipStepSameTipsInfo(props: RecoveryContentProps): JSX.Element {
  const { routeUpdateActions, recoveryCommands } = props
  const { skipFailedCommand } = recoveryCommands
  const { handleMotionRouting } = routeUpdateActions
  const { ROBOT_SKIPPING_STEP } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')

  const primaryBtnOnClick = (): Promise<void> => {
    return handleMotionRouting(true, ROBOT_SKIPPING_STEP.ROUTE).then(() => {
      skipFailedCommand()
    })
  }

  const buildBodyText = (): JSX.Element => {
    return (
      <Trans
        t={t}
        i18nKey="failed_dispense_step_not_completed"
        components={{
          block: <LegacyStyledText as="p" />,
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
    />
  )
}
