import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import head from 'lodash/head'
import { css } from 'styled-components'

import {
  DIRECTION_COLUMN,
  Flex,
  RadioButton,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'

import {
  ERROR_KINDS,
  ODD_SECTION_TITLE_STYLE,
  RECOVERY_MAP,
} from '../constants'
import { RecoverySingleColumnContentWrapper } from '../shared'

import type { ReactNode } from 'react'
import type { PipetteWithTip } from '/app/resources/instruments'
import type { ErrorKind, RecoveryContentProps, RecoveryRoute } from '../types'

// The "home" route within Error Recovery. When a user completes a non-terminal flow or presses "Go back" enough
// to escape the boundaries of any route, they will be redirected here.
export function SelectRecoveryOption(props: RecoveryContentProps): ReactNode {
  const { recoveryMap } = props
  const { step } = recoveryMap
  const { OPTION_SELECTION } = RECOVERY_MAP

  const buildContent = (): JSX.Element => {
    switch (step) {
      case OPTION_SELECTION.STEPS.SELECT:
        return <SelectRecoveryOptionHome {...props} />
      default:
        return <SelectRecoveryOptionHome {...props} />
    }
  }

  return buildContent()
}

export function SelectRecoveryOptionHome({
  errorKind,
  routeUpdateActions,
  tipStatusUtils,
  currentRecoveryOptionUtils,
  getRecoveryOptionCopy,
  analytics,
  isOnDevice,
  failedCommand,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { proceedToRouteAndStep } = routeUpdateActions
  const { determineTipStatus } = tipStatusUtils
  const { setSelectedRecoveryOption } = currentRecoveryOptionUtils
  const validRecoveryOptions = getRecoveryOptions(
    errorKind,
    failedCommand?.byRunRecord.commandType
  )
  const [selectedRoute, setSelectedRoute] = useState<RecoveryRoute>(
    head(validRecoveryOptions)!
  )

  useCurrentTipStatus(determineTipStatus)

  const proceed = (): void => {
    analytics.reportActionSelectedEvent(selectedRoute)
    setSelectedRecoveryOption(selectedRoute)
    void proceedToRouteAndStep(selectedRoute as RecoveryRoute)
  }

  if (validRecoveryOptions.length === 1) {
    // If there is only one valid recovery option, automatically proceed to that route
    proceed()
  }

  return (
    <Flex css={CONTAINER_STYLE}>
      <RecoverySingleColumnContentWrapper
        css={CONTENT_WRAPPER_OVERRIDE_STYLE}
        footerDetails={{
          primaryBtnOnClick: proceed,
          isSticky: true,
        }}
      >
        <Flex css={CONTENT_STYLE}>
          <StyledText
            oddStyle="level4HeaderSemiBold"
            desktopStyle="headingSmallBold"
            css={ODD_SECTION_TITLE_STYLE}
          >
            {t('choose_a_recovery_action')}
          </StyledText>
          <RecoveryOptions
            validRecoveryOptions={validRecoveryOptions}
            setSelectedRoute={setSelectedRoute}
            selectedRoute={selectedRoute}
            getRecoveryOptionCopy={getRecoveryOptionCopy}
            errorKind={errorKind}
            isOnDevice={isOnDevice}
          />
        </Flex>
      </RecoverySingleColumnContentWrapper>
    </Flex>
  )
}

const CONTAINER_STYLE = css`
  width: 100%;
  overflow: auto;

  &::-webkit-scrollbar {
    display: none;
  }
`

const CONTENT_WRAPPER_OVERRIDE_STYLE = css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing12};
  }
`

const CONTENT_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  gap: ${SPACING.spacing16};
`

interface RecoveryOptionsProps {
  validRecoveryOptions: RecoveryRoute[]
  setSelectedRoute: (route: RecoveryRoute) => void
  getRecoveryOptionCopy: RecoveryContentProps['getRecoveryOptionCopy']
  errorKind: RecoveryContentProps['errorKind']
  isOnDevice: RecoveryContentProps['isOnDevice']
  selectedRoute?: RecoveryRoute
}

export function RecoveryOptions({
  errorKind,
  validRecoveryOptions,
  selectedRoute,
  setSelectedRoute,
  getRecoveryOptionCopy,
  isOnDevice,
}: RecoveryOptionsProps): ReactNode {
  return (
    <Flex css={RECOVERY_OPTION_CONTAINER_STYLE}>
      {validRecoveryOptions.map((recoveryOption: RecoveryRoute) => {
        const optionName = getRecoveryOptionCopy(recoveryOption, errorKind)
        return (
          <RadioButton
            key={`recovery_option_${optionName}`}
            buttonLabel={optionName}
            buttonValue={optionName}
            onChange={() => {
              setSelectedRoute(recoveryOption)
            }}
            isSelected={recoveryOption === selectedRoute}
            radioButtonType="large"
            largeDesktopBorderRadius={!isOnDevice}
          />
        )
      })}
    </Flex>
  )
}

const RECOVERY_OPTION_CONTAINER_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing4};
  width: 100%;

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing8};
  }
`

// Pre-fetch tip attachment status. Users are not blocked from proceeding at this step.
export function useCurrentTipStatus(
  determineTipStatus: () => Promise<PipetteWithTip[]>
): void {
  useEffect(
    () => {
      void determineTipStatus()
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
}

export function getRecoveryOptions(
  errorKind: ErrorKind,
  commandType?: string
): RecoveryRoute[] {
  switch (errorKind) {
    case ERROR_KINDS.NO_LIQUID_DETECTED:
      return NO_LIQUID_DETECTED_OPTIONS
    case ERROR_KINDS.OVERPRESSURE_PREPARE_TO_ASPIRATE:
      return OVERPRESSURE_PREPARE_TO_ASPIRATE
    case ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING:
      return OVERPRESSURE_WHILE_ASPIRATING_OPTIONS
    case ERROR_KINDS.OVERPRESSURE_WHILE_DISPENSING:
      return OVERPRESSURE_WHILE_DISPENSING_OPTIONS
    case ERROR_KINDS.TIP_NOT_DETECTED:
      return TIP_NOT_DETECTED_OPTIONS
    case ERROR_KINDS.TIP_DROP_FAILED:
      return TIP_DROP_FAILED_OPTIONS
    case ERROR_KINDS.GRIPPER_ERROR:
      return GRIPPER_ERROR_OPTIONS
    case ERROR_KINDS.GENERAL_ERROR:
      return GENERAL_ERROR_OPTIONS
    case ERROR_KINDS.STALL_OR_COLLISION:
      return STALL_OR_COLLISION_OPTIONS
    case ERROR_KINDS.STACKER_STALLED:
      return commandType === 'flexStacker/store'
        ? STACKER_STALLED_STORE_OPTIONS
        : STACKER_STALLED_RETRIEVE_OPTIONS
    case ERROR_KINDS.STACKER_HOPPER_EMPTY:
      return STACKER_HOPPER_EMPTY_OPTIONS
    case ERROR_KINDS.STACKER_SHUTTLE_MISSING:
      return STACKER_SHUTTLE_MISSING_OPTIONS
    case ERROR_KINDS.STACKER_SHUTTLE_EMPTY:
      return STACKER_SHUTTLE_EMPTY_OPTIONS
    case ERROR_KINDS.STACKER_SHUTTLE_STORE_EMPTY:
      return STACKER_SHUTTLE_EMPTY_STORE_OPTIONS
    case ERROR_KINDS.STACKER_SHUTTLE_OCCUPIED:
      return STACKER_SHUTTLE_OCCUPIED_OPTIONS
    case ERROR_KINDS.STACKER_HOPPER_OR_SHUTTLE_EMPTY:
      return [RECOVERY_MAP.STACKER_HOPPER_OR_SHUTTLE_EMPTY.ROUTE]
    case ERROR_KINDS.VACUUM_CARBOY_FULL:
      return VACUUM_CARBOY_FULL_OPTIONS
    case ERROR_KINDS.VACUUM_PRESSURE_NOT_REACHED:
      return VACUUM_PRESSURE_NOT_REACHED_OPTIONS
  }
}

export const STACKER_SHUTTLE_OCCUPIED_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.SHUTTLE_FULL_RETRY.ROUTE,
  RECOVERY_MAP.SHUTTLE_FULL_SKIP.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const STACKER_SHUTTLE_EMPTY_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE,
  RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const STACKER_SHUTTLE_EMPTY_STORE_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_RETRY.ROUTE,
  RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_SKIP.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const STACKER_SHUTTLE_MISSING_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const STACKER_HOPPER_EMPTY_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE,
  RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const STACKER_STALLED_RETRIEVE_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE,
  RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const STACKER_STALLED_STORE_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.STACKER_STALLED_STORE_RETRY.ROUTE,
  RECOVERY_MAP.STACKER_STALLED_STORE_SKIP.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const STALL_OR_COLLISION_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.HOME_AND_RETRY.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const NO_LIQUID_DETECTED_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.MANUAL_FILL_AND_RETRY_SAME_TIPS.ROUTE,
  RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE,
  RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const OVERPRESSURE_PREPARE_TO_ASPIRATE: RecoveryRoute[] = [
  RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE,
  RECOVERY_MAP.RETRY_SAME_TIPS.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const OVERPRESSURE_WHILE_ASPIRATING_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const OVERPRESSURE_WHILE_DISPENSING_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.SKIP_STEP_WITH_SAME_TIPS.ROUTE,
  RECOVERY_MAP.SKIP_STEP_WITH_NEW_TIPS.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const TIP_NOT_DETECTED_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.RETRY_STEP.ROUTE,
  RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const TIP_DROP_FAILED_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.RETRY_STEP.ROUTE,
  RECOVERY_MAP.IGNORE_AND_SKIP.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const GRIPPER_ERROR_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.MANUAL_MOVE_AND_SKIP.ROUTE,
  RECOVERY_MAP.MANUAL_REPLACE_AND_RETRY.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const GENERAL_ERROR_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.RETRY_STEP.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const VACUUM_CARBOY_FULL_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.VACUUM_CARBOY_FULL_RETRY.ROUTE,
  RECOVERY_MAP.VACUUM_CARBOY_FULL_SKIP.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const VACUUM_PRESSURE_NOT_REACHED_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.VACUUM_PRESSURE_NOT_REACHED_RETRY.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]
