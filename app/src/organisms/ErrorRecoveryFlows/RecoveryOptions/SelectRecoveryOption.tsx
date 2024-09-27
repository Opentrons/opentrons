import { useState, useEffect } from 'react'
import head from 'lodash/head'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  RadioButton,
} from '@opentrons/components'

import {
  RECOVERY_MAP,
  ERROR_KINDS,
  ODD_SECTION_TITLE_STYLE,
  ODD_ONLY,
  DESKTOP_ONLY,
} from '../constants'
import {
  RecoveryODDOneDesktopTwoColumnContentWrapper,
  RecoveryRadioGroup,
  FailedStepNextStep,
} from '../shared'

import type { ErrorKind, RecoveryContentProps, RecoveryRoute } from '../types'
import type { PipetteWithTip } from '../../DropTipWizardFlows'

// The "home" route within Error Recovery. When a user completes a non-terminal flow or presses "Go back" enough
// to escape the boundaries of any route, they will be redirected here.
export function SelectRecoveryOption(props: RecoveryContentProps): JSX.Element {
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
  ...rest
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { proceedToRouteAndStep } = routeUpdateActions
  const { determineTipStatus } = tipStatusUtils
  const { setSelectedRecoveryOption } = currentRecoveryOptionUtils
  const validRecoveryOptions = getRecoveryOptions(errorKind)
  const [selectedRoute, setSelectedRoute] = useState<RecoveryRoute>(
    head(validRecoveryOptions) as RecoveryRoute
  )

  useCurrentTipStatus(determineTipStatus)

  return (
    <RecoveryODDOneDesktopTwoColumnContentWrapper
      footerDetails={{
        primaryBtnOnClick: () => {
          analytics.reportActionSelectedEvent(selectedRoute)
          setSelectedRecoveryOption(selectedRoute)
          void proceedToRouteAndStep(selectedRoute as RecoveryRoute)
        },
      }}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText
          oddStyle="level4HeaderSemiBold"
          desktopStyle="headingSmallBold"
          css={ODD_SECTION_TITLE_STYLE}
        >
          {t('choose_a_recovery_action')}
        </StyledText>
        <Flex css={ODD_ONLY}>
          <ODDRecoveryOptions
            validRecoveryOptions={validRecoveryOptions}
            setSelectedRoute={setSelectedRoute}
            selectedRoute={selectedRoute}
            getRecoveryOptionCopy={getRecoveryOptionCopy}
          />
        </Flex>
        <Flex css={DESKTOP_ONLY}>
          <DesktopRecoveryOptions
            validRecoveryOptions={validRecoveryOptions}
            setSelectedRoute={setSelectedRoute}
            selectedRoute={selectedRoute}
            getRecoveryOptionCopy={getRecoveryOptionCopy}
          />
        </Flex>
      </Flex>
      <FailedStepNextStep {...rest} />
    </RecoveryODDOneDesktopTwoColumnContentWrapper>
  )
}

interface RecoveryOptionsProps {
  validRecoveryOptions: RecoveryRoute[]
  setSelectedRoute: (route: RecoveryRoute) => void
  getRecoveryOptionCopy: RecoveryContentProps['getRecoveryOptionCopy']
  selectedRoute?: RecoveryRoute
}
// For ODD use only.
export function ODDRecoveryOptions({
  validRecoveryOptions,
  selectedRoute,
  setSelectedRoute,
  getRecoveryOptionCopy,
}: RecoveryOptionsProps): JSX.Element {
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing8}
      width="100%"
    >
      {validRecoveryOptions.map((recoveryOption: RecoveryRoute) => {
        const optionName = getRecoveryOptionCopy(recoveryOption)
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
          />
        )
      })}
    </Flex>
  )
}

export function DesktopRecoveryOptions({
  validRecoveryOptions,
  selectedRoute,
  setSelectedRoute,
  getRecoveryOptionCopy,
}: RecoveryOptionsProps): JSX.Element {
  return (
    <RecoveryRadioGroup
      css={RADIO_GAP}
      onChange={e => {
        setSelectedRoute(e.currentTarget.value)
      }}
      value={selectedRoute}
      options={validRecoveryOptions.map(
        (option: RecoveryRoute) =>
          ({
            value: option,
            children: (
              <StyledText
                desktopStyle="bodyDefaultRegular"
                role="label"
                htmlFor={option}
              >
                {getRecoveryOptionCopy(option)}
              </StyledText>
            ),
          } as const)
      )}
    />
  )
}
// Pre-fetch tip attachment status. Users are not blocked from proceeding at this step.
export function useCurrentTipStatus(
  determineTipStatus: () => Promise<PipetteWithTip[]>
): void {
  useEffect(() => {
    void determineTipStatus()
  }, [])
}

export function getRecoveryOptions(errorKind: ErrorKind): RecoveryRoute[] {
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
    case ERROR_KINDS.GENERAL_ERROR:
      return GENERAL_ERROR_OPTIONS
  }
}

export const NO_LIQUID_DETECTED_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.FILL_MANUALLY_AND_SKIP.ROUTE,
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

export const GENERAL_ERROR_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.RETRY_STEP.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

const RADIO_GAP = `
  gap: ${SPACING.spacing4};
`
