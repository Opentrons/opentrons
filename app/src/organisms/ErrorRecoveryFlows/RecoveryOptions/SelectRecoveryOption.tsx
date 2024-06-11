import * as React from 'react'
import head from 'lodash/head'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import {
  RECOVERY_MAP,
  ERROR_KINDS,
  ODD_SECTION_TITLE_STYLE,
} from '../constants'
import { RadioButton } from '../../../atoms/buttons'
import { RecoveryFooterButtons, RecoverySingleColumnContent } from '../shared'

import type { ErrorKind, RecoveryContentProps, RecoveryRoute } from '../types'
import type { PipetteWithTip } from '../../DropTipWizardFlows'

// The "home" screen within Error Recovery. When a user completes a non-terminal flow or presses "Go back" enough
// to escape the boundaries of a route, they will be redirected here.
export function SelectRecoveryOption({
  isOnDevice,
  errorKind,
  routeUpdateActions,
  tipStatusUtils,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { proceedToRouteAndStep } = routeUpdateActions
  const { determineTipStatus } = tipStatusUtils
  const validRecoveryOptions = getRecoveryOptions(errorKind)
  const [selectedRoute, setSelectedRoute] = React.useState<RecoveryRoute>(
    head(validRecoveryOptions) as RecoveryRoute
  )

  useCurrentTipStatus(determineTipStatus)

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <StyledText css={ODD_SECTION_TITLE_STYLE} as="h4SemiBold">
          {t('choose_a_recovery_action')}
        </StyledText>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <RecoveryOptions
            errorKind={errorKind}
            validRecoveryOptions={validRecoveryOptions}
            setSelectedRoute={setSelectedRoute}
            selectedRoute={selectedRoute}
          />
        </Flex>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={() =>
            proceedToRouteAndStep(selectedRoute as RecoveryRoute)
          }
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}

interface RecoveryOptionsProps {
  errorKind: ErrorKind
  validRecoveryOptions: RecoveryRoute[]
  setSelectedRoute: (route: RecoveryRoute) => void
  selectedRoute?: RecoveryRoute
}
export function RecoveryOptions({
  errorKind,
  validRecoveryOptions,
  selectedRoute,
  setSelectedRoute,
}: RecoveryOptionsProps): JSX.Element[] {
  const { t } = useTranslation('error_recovery')

  return validRecoveryOptions.map((recoveryOption: RecoveryRoute) => {
    const buildOptionName = (): string => {
      switch (recoveryOption) {
        case RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE:
          return t('retry_step')
        case RECOVERY_MAP.CANCEL_RUN.ROUTE:
          return t('cancel_run')
        case RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE:
          if (errorKind === ERROR_KINDS.OVERPERSSURE_WHILE_ASPIRATING) {
            return t('retry_with_new_tips')
          } else {
            return 'INVALID_OPTION'
          }
        default:
          return 'INVALID_OPTION'
      }
    }
    const optionName = buildOptionName()

    return (
      <RadioButton
        key={`recovery_option_${optionName}`}
        buttonLabel={optionName}
        buttonValue={optionName}
        onChange={() => {
          setSelectedRoute(recoveryOption)
        }}
        isSelected={recoveryOption === selectedRoute}
      />
    )
  })
}

// Pre-fetch tip attachment status. Users are not blocked from proceeding at this step.
export function useCurrentTipStatus(
  determineTipStatus: () => Promise<PipetteWithTip[]>
): void {
  React.useEffect(() => {
    void determineTipStatus()
  }, [])
}

export function getRecoveryOptions(errorKind: ErrorKind): RecoveryRoute[] {
  switch (errorKind) {
    case ERROR_KINDS.OVERPERSSURE_WHILE_ASPIRATING:
      return OVERPRESSURE_WHILE_ASPIRATING_OPTIONS
    case ERROR_KINDS.GENERAL_ERROR:
      return GENERAL_ERROR_OPTIONS
  }
}

export const GENERAL_ERROR_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.RETRY_FAILED_COMMAND.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]

export const OVERPRESSURE_WHILE_ASPIRATING_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.DROP_TIP_FLOWS.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]
