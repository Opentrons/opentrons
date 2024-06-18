import * as React from 'react'

import { RECOVERY_MAP } from '../constants'
import { CancelRun } from './CancelRun'
import {
  RecoveryFooterButtons,
  RecoverySingleColumnContent,
  LeftColumnLabwareInfo,
  RecoveryMap,
  FailedStepNextStep,
} from '../shared'

import type { RecoveryContentProps } from '../types'
import { TwoColumn } from '../../../molecules/InterventionModal'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { Trans, useTranslation } from 'react-i18next'

export function FillWellAndSkip(
  props: RecoveryContentProps
): JSX.Element | null {
  const { recoveryMap } = props
  const { step } = recoveryMap
  const { FILL_MANUALLY_AND_SKIP, CANCEL_RUN } = RECOVERY_MAP

  const buildContent = (): JSX.Element | null => {
    switch (step) {
      case FILL_MANUALLY_AND_SKIP.STEPS.MANUALLY_FILL:
        return <FillWell {...props} />
      case FILL_MANUALLY_AND_SKIP.STEPS.SKIP_RUN_STEP:
        return <SkipToNextStep {...props} />
      case CANCEL_RUN.STEPS.CONFIRM_CANCEL:
        return <CancelRun {...props} />
      default:
        return <FillWell {...props} />
    }
  }

  return buildContent()
}

function FillWell(props: RecoveryContentProps): JSX.Element | null {
  const { isOnDevice, routeUpdateActions, failedLabwareUtils } = props
  const { t } = useTranslation('error_recovery')
  const { goBackPrevStep, proceedNextStep } = routeUpdateActions

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <TwoColumn>
          <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
            <LeftColumnLabwareInfo
              {...props}
              title={t('manually_fill_liquid_in_well', {
                well: failedLabwareUtils.relevantWellName,
              })}
              moveType="refill"
            />
          </Flex>
          <Flex marginTop="1.742rem">
            <RecoveryMap {...props} />
          </Flex>
        </TwoColumn>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={proceedNextStep}
          secondaryBtnOnClick={goBackPrevStep}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}

function SkipToNextStep(props: RecoveryContentProps): JSX.Element | null {
  const { isOnDevice, routeUpdateActions, recoveryCommands } = props
  const { goBackPrevStep, setRobotInMotion } = routeUpdateActions
  const { skipFailedCommand, resumeRun } = recoveryCommands
  const { ROBOT_SKIPPING_STEP } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')

  const primaryBtnOnClick = (): Promise<void> => {
    return setRobotInMotion(true, ROBOT_SKIPPING_STEP.ROUTE)
      .then(() => skipFailedCommand())
      .then(() => {
        resumeRun()
      })
  }

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <TwoColumn>
          <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
            <StyledText as="h4SemiBold">{t('skip_to_next_step')}</StyledText>
            <Trans
              t={t}
              i18nKey="robot_will_not_check_for_liquid"
              components={{
                block: <StyledText as="p" />,
              }}
            />
          </Flex>
          <FailedStepNextStep {...props} />
        </TwoColumn>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={primaryBtnOnClick}
          secondaryBtnOnClick={goBackPrevStep}
          primaryBtnTextOverride={t('continue_run_now')}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}
