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
  currentRecoveryOptionUtils,
  getRecoveryOptionCopy,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { proceedToRouteAndStep } = routeUpdateActions
  const { determineTipStatus } = tipStatusUtils
  const { setSelectedRecoveryOption } = currentRecoveryOptionUtils
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
            validRecoveryOptions={validRecoveryOptions}
            setSelectedRoute={setSelectedRoute}
            selectedRoute={selectedRoute}
            getRecoveryOptionCopy={getRecoveryOptionCopy}
          />
        </Flex>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={() => {
            setSelectedRecoveryOption(selectedRoute)
            void proceedToRouteAndStep(selectedRoute as RecoveryRoute)
          }}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}

interface RecoveryOptionsProps {
  validRecoveryOptions: RecoveryRoute[]
  setSelectedRoute: (route: RecoveryRoute) => void
  getRecoveryOptionCopy: RecoveryContentProps['getRecoveryOptionCopy']
  selectedRoute?: RecoveryRoute
}
export function RecoveryOptions({
  validRecoveryOptions,
  selectedRoute,
  setSelectedRoute,
  getRecoveryOptionCopy,
}: RecoveryOptionsProps): JSX.Element[] {
  return validRecoveryOptions.map((recoveryOption: RecoveryRoute) => {
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
    case ERROR_KINDS.OVERPRESSURE_WHILE_ASPIRATING:
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
  RECOVERY_MAP.RETRY_NEW_TIPS.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]
