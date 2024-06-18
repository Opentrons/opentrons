import * as React from 'react'
import { useTranslation } from 'react-i18next'
import head from 'lodash/head'

import {
  DIRECTION_COLUMN,
  SPACING,
  Flex,
  StyledText,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { RadioButton } from '../../../atoms/buttons'
import { ODD_SECTION_TITLE_STYLE, RECOVERY_MAP } from '../constants'
import { RecoveryFooterButtons, RecoverySingleColumnContent } from '../shared'
import { DropTipWizardFlows } from '../../DropTipWizardFlows'
import { DT_ROUTES } from '../../DropTipWizardFlows/constants'

import type { PipetteWithTip } from '../../DropTipWizardFlows'
import type { RecoveryContentProps } from '../types'
import type { FixitCommandTypeUtils } from '../../DropTipWizardFlows/types'

// The Drop Tip flow entry point. Includes entry from SelectRecoveryOption and CancelRun.
export function ManageTips(props: RecoveryContentProps): JSX.Element | null {
  const { recoveryMap } = props

  const buildContent = (): JSX.Element | null => {
    const { DROP_TIP_FLOWS } = RECOVERY_MAP
    const { step } = recoveryMap

    switch (step) {
      case DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL:
        return <BeginRemoval {...props} />
      case DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING:
      case DROP_TIP_FLOWS.STEPS.CHOOSE_BLOWOUT:
      case DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP:
        return <DropTipFlowsContainer {...props} />
      default:
        return <DropTipFlowsContainer {...props} />
    }
  }

  return buildContent()
}

type RemovalOptions = 'begin-removal' | 'skip'

export function BeginRemoval({
  isOnDevice,
  tipStatusUtils,
  routeUpdateActions,
  recoveryCommands,
  currentRecoveryOptionUtils,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { pipettesWithTip } = tipStatusUtils
  const {
    proceedNextStep,
    setRobotInMotion,
    proceedToRouteAndStep,
  } = routeUpdateActions
  const { cancelRun } = recoveryCommands
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { ROBOT_CANCELING, RETRY_NEW_TIPS } = RECOVERY_MAP
  const mount = head(pipettesWithTip)?.mount

  const [selected, setSelected] = React.useState<RemovalOptions>(
    'begin-removal'
  )

  const primaryOnClick = (): void => {
    if (selected === 'begin-removal') {
      void proceedNextStep()
    } else {
      if (selectedRecoveryOption === RETRY_NEW_TIPS.ROUTE) {
        void proceedToRouteAndStep(
          RETRY_NEW_TIPS.ROUTE,
          RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
        )
      } else {
        void setRobotInMotion(true, ROBOT_CANCELING.ROUTE).then(() => {
          cancelRun()
        })
      }
    }
  }

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <StyledText css={ODD_SECTION_TITLE_STYLE} as="h4SemiBold">
          {t('you_may_want_to_remove', { mount })}
        </StyledText>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <RadioButton
            buttonLabel={t('begin_removal')}
            buttonValue={t('begin_removal')}
            onChange={() => {
              setSelected('begin-removal')
            }}
            isSelected={selected === 'begin-removal'}
          />
          <RadioButton
            buttonLabel={t('skip')}
            buttonValue={t('skip')}
            onChange={() => {
              setSelected('skip')
            }}
            isSelected={selected === 'skip'}
          />
        </Flex>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={primaryOnClick}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}

function DropTipFlowsContainer(props: RecoveryContentProps): JSX.Element {
  const {
    tipStatusUtils,
    routeUpdateActions,
    recoveryCommands,
    isFlex,
    currentRecoveryOptionUtils,
  } = props
  const { DROP_TIP_FLOWS, ROBOT_CANCELING, RETRY_NEW_TIPS } = RECOVERY_MAP
  const { proceedToRouteAndStep, setRobotInMotion } = routeUpdateActions
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { setTipStatusResolved } = tipStatusUtils
  const { cancelRun } = recoveryCommands

  const { mount, specs } = head(
    tipStatusUtils.pipettesWithTip
  ) as PipetteWithTip // Safe as we have to have tips to get to this point in the flow.

  const onCloseFlow = (): void => {
    if (selectedRecoveryOption === RETRY_NEW_TIPS.ROUTE) {
      void proceedToRouteAndStep(
        RETRY_NEW_TIPS.ROUTE,
        RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
      )
    } else {
      void setTipStatusResolved(onEmptyCache, onTipsDetected)
    }
  }

  const onEmptyCache = (): void => {
    void setRobotInMotion(true, ROBOT_CANCELING.ROUTE).then(() => {
      cancelRun()
    })
  }

  const onTipsDetected = (): void => {
    void proceedToRouteAndStep(DROP_TIP_FLOWS.ROUTE)
  }

  return (
    <RecoverySingleColumnContent>
      <DropTipWizardFlows
        robotType={isFlex ? FLEX_ROBOT_TYPE : OT2_ROBOT_TYPE}
        closeFlow={onCloseFlow}
        mount={mount}
        instrumentModelSpecs={specs}
        fixitCommandTypeUtils={useDropTipFlowUtils(props)}
      />
    </RecoverySingleColumnContent>
  )
}

// Builds the overrides injected into DT Wiz.
export function useDropTipFlowUtils({
  tipStatusUtils,
  failedCommand,
  currentRecoveryOptionUtils,
  trackExternalMap,
  routeUpdateActions,
  recoveryMap,
}: RecoveryContentProps): FixitCommandTypeUtils {
  const { t } = useTranslation('error_recovery')
  const {
    RETRY_NEW_TIPS,
    ERROR_WHILE_RECOVERING,
    DROP_TIP_FLOWS,
  } = RECOVERY_MAP
  const { runId } = tipStatusUtils
  const { step } = recoveryMap
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { proceedToRouteAndStep } = routeUpdateActions
  const failedCommandId = failedCommand?.id ?? '' // We should have a failed command here unless the run is not in AWAITING_RECOVERY.

  const buildTipDropCompleteBtn = (): string => {
    switch (selectedRecoveryOption) {
      case RETRY_NEW_TIPS.ROUTE:
        return t('proceed_to_tip_selection')
      default:
        return t('proceed_to_cancel')
    }
  }

  const buildCopyOverrides = (): FixitCommandTypeUtils['copyOverrides'] => {
    return {
      tipDropCompleteBtnCopy: buildTipDropCompleteBtn(),
      beforeBeginningTopText: t('preserve_aspirated_liquid'),
    }
  }

  const buildErrorOverrides = (): FixitCommandTypeUtils['errorOverrides'] => {
    return {
      tipDropFailed: () => {
        return proceedToRouteAndStep(
          ERROR_WHILE_RECOVERING.ROUTE,
          ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_TIP_DROP_FAILED
        )
      },
      blowoutFailed: () => {
        return proceedToRouteAndStep(
          ERROR_WHILE_RECOVERING.ROUTE,
          ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_BLOWOUT_FAILED
        )
      },
      generalFailure: () =>
        proceedToRouteAndStep(
          ERROR_WHILE_RECOVERING.ROUTE,
          ERROR_WHILE_RECOVERING.STEPS.DROP_TIP_GENERAL_ERROR
        ),
    }
  }

  // If a specific step within the DROP_TIP_FLOWS route is selected, begin the Drop Tip Flows at its related route.
  const buildRouteOverride = (): FixitCommandTypeUtils['routeOverride'] => {
    switch (step) {
      case DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP:
        return DT_ROUTES.DROP_TIP
      case DROP_TIP_FLOWS.STEPS.CHOOSE_BLOWOUT:
        return DT_ROUTES.BLOWOUT
    }
  }

  return {
    runId,
    failedCommandId,
    copyOverrides: buildCopyOverrides(),
    trackCurrentMap: trackExternalMap,
    errorOverrides: buildErrorOverrides(),
    routeOverride: buildRouteOverride(),
  }
}
