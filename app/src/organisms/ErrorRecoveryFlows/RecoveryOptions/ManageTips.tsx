import { Trans, useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { DropTipWizardFlows } from '/app/organisms/DropTipWizardFlows'
import { DT_ROUTES } from '/app/organisms/DropTipWizardFlows/constants'

import {
  FLEX_WIDTH_ALERT_INFO_STYLE,
  ICON_SIZE_ALERT_INFO_STYLE,
  RECOVERY_MAP,
} from '../constants'
import {
  RecoveryFooterButtons,
  RecoverySingleColumnContentWrapper,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { FixitCommandTypeUtils } from '/app/organisms/DropTipWizardFlows'
import type { RecoveryContentProps, RecoveryRoute, RouteStep } from '../types'

// The Drop Tip flow entry point. Includes entry from SelectRecoveryOption and CancelRun.
export function ManageTips(props: RecoveryContentProps): ReactNode {
  const { recoveryMap } = props

  routeAlternativelyIfNoPipette(props)

  const buildContent = (): JSX.Element => {
    const { DROP_TIP_FLOWS, HOME_AND_RETRY } = RECOVERY_MAP
    const { step, route } = recoveryMap

    switch (step) {
      case DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL:
        return <BeginRemoval {...props} />
      case DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING:
      case DROP_TIP_FLOWS.STEPS.CHOOSE_BLOWOUT:
      case DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP:
        return <DropTipFlowsContainer {...props} />
      case HOME_AND_RETRY.STEPS.REMOVE_TIPS_FROM_PIPETTE:
        return <BeginRemoval {...props} />
      default:
        console.warn(
          `ManageTips: ${step} in ${route} not explicitly handled. Rerouting.`
        )
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}

export function BeginRemoval({
  tipStatusUtils,
  routeUpdateActions,
  recoveryCommands,
  currentRecoveryOptionUtils,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { aPipetteWithTip } = tipStatusUtils
  const { proceedNextStep, handleMotionRouting, proceedToRouteAndStep } =
    routeUpdateActions
  const { cancelRun } = recoveryCommands
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const {
    ROBOT_CANCELING,
    RETRY_NEW_TIPS,
    HOME_AND_RETRY,
    MANUAL_FILL_AND_RETRY_NEW_TIPS,
    DROP_TIP_FLOWS,
  } = RECOVERY_MAP
  const mount = aPipetteWithTip?.mount

  const primaryOnClick = (): void => {
    if (selectedRecoveryOption === HOME_AND_RETRY.ROUTE) {
      void proceedToRouteAndStep(
        DROP_TIP_FLOWS.ROUTE,
        DROP_TIP_FLOWS.STEPS.BEFORE_BEGINNING
      )
    } else {
      void proceedNextStep()
    }
  }

  const secondaryOnClick = (): void => {
    if (selectedRecoveryOption === RETRY_NEW_TIPS.ROUTE) {
      void proceedToRouteAndStep(
        RETRY_NEW_TIPS.ROUTE,
        RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
      )
    } else if (selectedRecoveryOption === HOME_AND_RETRY.ROUTE) {
      void proceedToRouteAndStep(
        HOME_AND_RETRY.ROUTE,
        HOME_AND_RETRY.STEPS.HOME_BEFORE_RETRY
      )
    } else if (
      selectedRecoveryOption === MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE
    ) {
      void proceedToRouteAndStep(
        MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
        MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
      )
    } else {
      void handleMotionRouting(true, ROBOT_CANCELING.ROUTE).then(() => {
        cancelRun()
      })
    }
  }

  return (
    <RecoverySingleColumnContentWrapper
      gridGap={SPACING.spacing24}
      alignItems={ALIGN_CENTER}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing16}
        padding={`${SPACING.spacing32} ${SPACING.spacing16}`}
        height="100%"
        css={FLEX_WIDTH_ALERT_INFO_STYLE}
      >
        <Icon
          name="ot-alert"
          css={ICON_SIZE_ALERT_INFO_STYLE}
          marginTop={SPACING.spacing24}
          color={COLORS.red50}
        />
        <StyledText oddStyle="level3HeaderBold" desktopStyle="headingSmallBold">
          {t('remove_any_attached_tips')}
        </StyledText>
        <StyledText
          oddStyle="level4HeaderRegular"
          desktopStyle="bodyDefaultRegular"
          color={COLORS.black90}
          textAlign={ALIGN_CENTER}
        >
          <Trans
            t={t}
            i18nKey="homing_pipette_dangerous"
            values={{
              mount,
            }}
            components={{
              bold: <strong />,
            }}
          />
        </StyledText>
      </Flex>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryOnClick}
        primaryBtnTextOverride={t('begin_removal')}
        secondaryBtnOnClick={secondaryOnClick}
        secondaryBtnTextOverride={t('skip_and_home_pipette')}
        secondaryAsTertiary={true}
      />
    </RecoverySingleColumnContentWrapper>
  )
}

function DropTipFlowsContainer(
  props: RecoveryContentProps
): JSX.Element | null {
  const {
    robotType,
    tipStatusUtils,
    routeUpdateActions,
    recoveryCommands,
    currentRecoveryOptionUtils,
  } = props
  const {
    DROP_TIP_FLOWS,
    ROBOT_CANCELING,
    RETRY_NEW_TIPS,
    HOME_AND_RETRY,
    MANUAL_FILL_AND_RETRY_NEW_TIPS,
  } = RECOVERY_MAP
  const { proceedToRouteAndStep, handleMotionRouting } = routeUpdateActions
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { setTipStatusResolved } = tipStatusUtils
  const { cancelRun } = recoveryCommands

  const { mount, specs } = tipStatusUtils.aPipetteWithTip! // Safe as we have to have tips to get to this point in the flow.

  const onCloseFlow = (): void => {
    if (selectedRecoveryOption === RETRY_NEW_TIPS.ROUTE) {
      void proceedToRouteAndStep(
        RETRY_NEW_TIPS.ROUTE,
        RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
      )
    } else if (selectedRecoveryOption === HOME_AND_RETRY.ROUTE) {
      void proceedToRouteAndStep(
        HOME_AND_RETRY.ROUTE,
        HOME_AND_RETRY.STEPS.HOME_BEFORE_RETRY
      )
    } else if (
      selectedRecoveryOption === MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE
    ) {
      void proceedToRouteAndStep(
        MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
        MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
      )
    } else {
      void setTipStatusResolved(onEmptyCache, onTipsDetected)
    }
  }

  const onEmptyCache = (): void => {
    void handleMotionRouting(true, ROBOT_CANCELING.ROUTE).then(() => {
      cancelRun()
    })
  }

  const onTipsDetected = (): void => {
    void proceedToRouteAndStep(DROP_TIP_FLOWS.ROUTE)
  }

  const fixitCommandTypeUtils = useDropTipFlowUtils(props)

  return (
    <DropTipWizardFlows
      robotType={robotType}
      closeFlow={onCloseFlow}
      mount={mount}
      instrumentModelSpecs={specs}
      fixitCommandTypeUtils={fixitCommandTypeUtils}
      modalStyle="intervention"
    />
  )
}

// Builds the overrides injected into DT Wiz.
export function useDropTipFlowUtils({
  tipStatusUtils,
  failedCommand,
  currentRecoveryOptionUtils,
  subMapUtils,
  routeUpdateActions,
  recoveryMap,
  errorKind,
}: RecoveryContentProps): FixitCommandTypeUtils {
  const { t } = useTranslation('error_recovery')
  const {
    RETRY_NEW_TIPS,
    SKIP_STEP_WITH_NEW_TIPS,
    ERROR_WHILE_RECOVERING,
    DROP_TIP_FLOWS,
    HOME_AND_RETRY,
    MANUAL_FILL_AND_RETRY_NEW_TIPS,
  } = RECOVERY_MAP
  const { runId, gripperErrorFirstPipetteWithTip } = tipStatusUtils
  const { step } = recoveryMap
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { proceedToRouteAndStep } = routeUpdateActions
  const { updateSubMap, subMap } = subMapUtils
  const failedCommandId = failedCommand?.byRunRecord.id ?? '' // We should have a failed command here unless the run is not in AWAITING_RECOVERY.

  const buildTipDropCompleteBtn = (): string => {
    switch (selectedRecoveryOption) {
      case RETRY_NEW_TIPS.ROUTE:
      case SKIP_STEP_WITH_NEW_TIPS.ROUTE:
      case HOME_AND_RETRY.ROUTE:
      case MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE:
        return t('proceed_to_tip_selection')
      default:
        return t('proceed_to_cancel')
    }
  }

  const buildTipDropCompleteRouting = (): (() => void) | null => {
    const routeTo = (selectedRoute: RecoveryRoute, step: RouteStep): void => {
      void proceedToRouteAndStep(selectedRoute, step)
    }

    switch (selectedRecoveryOption) {
      case RETRY_NEW_TIPS.ROUTE:
        return () => {
          routeTo(selectedRecoveryOption, RETRY_NEW_TIPS.STEPS.REPLACE_TIPS)
        }
      case SKIP_STEP_WITH_NEW_TIPS.ROUTE:
        return () => {
          routeTo(
            selectedRecoveryOption,
            SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS
          )
        }
      case HOME_AND_RETRY.ROUTE:
        return () => {
          routeTo(selectedRecoveryOption, HOME_AND_RETRY.STEPS.REPLACE_TIPS)
        }
      case MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE:
        return () => {
          routeTo(
            selectedRecoveryOption,
            MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
          )
        }
      default:
        return null
    }
  }

  const buildCopyOverrides = (): FixitCommandTypeUtils['copyOverrides'] => {
    return {
      tipDropCompleteBtnCopy: buildTipDropCompleteBtn(),
      beforeBeginningTopText: t('do_you_need_to_blowout'),
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

  const buildButtonOverrides = (): FixitCommandTypeUtils['buttonOverrides'] => {
    return {
      goBackBeforeBeginning: () => {
        return proceedToRouteAndStep(DROP_TIP_FLOWS.ROUTE)
      },
      tipDropComplete: buildTipDropCompleteRouting(),
    }
  }

  // Leaving the documentation modal must unmount the drop tip wizard. Using the
  // normal closeFlow path re-checks tip status and re-enters this flow, which
  // immediately re-prompts for documentation.
  const onDocumentationCancel = (): void => {
    switch (selectedRecoveryOption) {
      case RETRY_NEW_TIPS.ROUTE:
        void proceedToRouteAndStep(
          RETRY_NEW_TIPS.ROUTE,
          RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
        )
        break
      case SKIP_STEP_WITH_NEW_TIPS.ROUTE:
        void proceedToRouteAndStep(
          SKIP_STEP_WITH_NEW_TIPS.ROUTE,
          SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS
        )
        break
      case HOME_AND_RETRY.ROUTE:
        void proceedToRouteAndStep(
          HOME_AND_RETRY.ROUTE,
          HOME_AND_RETRY.STEPS.HOME_BEFORE_RETRY
        )
        break
      case MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE:
        void proceedToRouteAndStep(
          MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
          MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
        )
        break
      case RECOVERY_MAP.CANCEL_RUN.ROUTE:
        void proceedToRouteAndStep(
          RECOVERY_MAP.CANCEL_RUN.ROUTE,
          RECOVERY_MAP.CANCEL_RUN.STEPS.CONFIRM_CANCEL
        )
        break
      default:
        // Splash cancel and other entry points: return to begin-removal so the
        // wizard unmounts and documentation is not prompted again.
        void proceedToRouteAndStep(
          DROP_TIP_FLOWS.ROUTE,
          DROP_TIP_FLOWS.STEPS.BEGIN_REMOVAL
        )
        break
    }
  }

  // If a specific step within the DROP_TIP_FLOWS route is selected, begin the Drop Tip Flows at its related route.
  //
  // NOTE: The substep is cleared by drop tip wizard after the completion of the wizard flow.
  const buildRouteOverride = (): FixitCommandTypeUtils['routeOverride'] => {
    if (subMap?.route != null) {
      return { route: subMap.route, step: subMap.step }
    }

    switch (step) {
      case DROP_TIP_FLOWS.STEPS.CHOOSE_TIP_DROP:
        return { route: DT_ROUTES.DROP_TIP, step: subMap?.step ?? null }
      case DROP_TIP_FLOWS.STEPS.CHOOSE_BLOWOUT:
        return { route: DT_ROUTES.BLOWOUT, step: subMap?.step ?? null }
    }
  }

  const pipetteId =
    gripperErrorFirstPipetteWithTip ??
    (failedCommand != null &&
    'params' in failedCommand.byRunRecord &&
    'pipetteId' in failedCommand.byRunRecord.params
      ? failedCommand.byRunRecord.params.pipetteId
      : null)

  return {
    runId,
    failedCommandId,
    pipetteId,
    copyOverrides: buildCopyOverrides(),
    errorOverrides: buildErrorOverrides(),
    buttonOverrides: buildButtonOverrides(),
    routeOverride: buildRouteOverride(),
    reportMap: updateSubMap,
    onDocumentationCancel,
  }
}

// Handle cases in which there is no pipette that could be used for drop tip wizard by routing
// to the next step or to option selection, if no special routing is provided.
function routeAlternativelyIfNoPipette(props: RecoveryContentProps): void {
  const { routeUpdateActions, currentRecoveryOptionUtils, tipStatusUtils } =
    props
  const { proceedToRouteAndStep } = routeUpdateActions
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const {
    RETRY_NEW_TIPS,
    SKIP_STEP_WITH_NEW_TIPS,
    OPTION_SELECTION,
    HOME_AND_RETRY,
    MANUAL_FILL_AND_RETRY_NEW_TIPS,
  } = RECOVERY_MAP

  if (tipStatusUtils.aPipetteWithTip == null) {
    switch (selectedRecoveryOption) {
      case RETRY_NEW_TIPS.ROUTE: {
        proceedToRouteAndStep(
          selectedRecoveryOption,
          RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
        )
        break
      }
      case SKIP_STEP_WITH_NEW_TIPS.ROUTE: {
        proceedToRouteAndStep(
          selectedRecoveryOption,
          SKIP_STEP_WITH_NEW_TIPS.STEPS.REPLACE_TIPS
        )
        break
      }
      case HOME_AND_RETRY.ROUTE: {
        proceedToRouteAndStep(
          selectedRecoveryOption,
          HOME_AND_RETRY.STEPS.HOME_BEFORE_RETRY
        )
        break
      }
      case MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE: {
        proceedToRouteAndStep(
          selectedRecoveryOption,
          MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS
        )
        break
      }
      default: {
        proceedToRouteAndStep(OPTION_SELECTION.ROUTE)
      }
    }
  }
}
