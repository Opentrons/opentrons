import * as React from 'react'
import head from 'lodash/head'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  SPACING,
  StyledText,
} from '@opentrons/components'

import {
  RECOVERY_MAP,
  ERROR_KINDS,
  ODD_SECTION_TITLE_STYLE,
} from '../constants'
import { RadioButton } from '../../../atoms/buttons'
import { RecoveryFooterButtons } from './shared'

import type { ErrorKind, RecoveryContentProps, RecoveryRoute } from '../types'

// The "home" screen within Error Recovery. When a user completes a non-terminal flow or presses "Go back" enough
// to escape the boundaries of a route, they will be redirected here.
export function SelectRecoveryOption({
  isOnDevice,
  errorKind,
  routeUpdateActions,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')
  const { proceedToRoute } = routeUpdateActions
  const validRecoveryOptions = getRecoveryOptions(errorKind)
  const [selectedRoute, setSelectedRoute] = React.useState<RecoveryRoute>(
    head(validRecoveryOptions) as RecoveryRoute
  )

  if (isOnDevice) {
    return (
      <Flex
        padding={SPACING.spacing32}
        flexDirection={DIRECTION_COLUMN}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        height="100%"
      >
        <StyledText css={ODD_SECTION_TITLE_STYLE} as="h4SemiBold">
          {t('how_do_you_want_to_proceed')}
        </StyledText>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
          <RecoveryOptions
            validRecoveryOptions={validRecoveryOptions}
            setSelectedRoute={setSelectedRoute}
            selectedRoute={selectedRoute}
          />
        </Flex>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={() =>
            proceedToRoute(selectedRoute as RecoveryRoute)
          }
          secondaryBtnOnClick={() =>
            proceedToRoute(RECOVERY_MAP.BEFORE_BEGINNING.ROUTE)
          }
        />
      </Flex>
    )
  } else {
    return null
  }
}

interface RecoveryOptionsProps {
  validRecoveryOptions: RecoveryRoute[]
  setSelectedRoute: (route: RecoveryRoute) => void
  selectedRoute?: RecoveryRoute
}
export function RecoveryOptions({
  validRecoveryOptions,
  selectedRoute,
  setSelectedRoute,
}: RecoveryOptionsProps): JSX.Element[] {
  const { t } = useTranslation('error_recovery')

  return validRecoveryOptions.map((recoveryOption: RecoveryRoute) => {
    const buildOptionName = (): string => {
      switch (recoveryOption) {
        case RECOVERY_MAP.RESUME.ROUTE:
          return t('resume')
        case RECOVERY_MAP.CANCEL_RUN.ROUTE:
          return t('cancel_run')
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
        onChange={() => setSelectedRoute(recoveryOption)}
        isSelected={recoveryOption === selectedRoute}
      />
    )
  })
}

export function getRecoveryOptions(errorKind: ErrorKind): RecoveryRoute[] {
  switch (errorKind) {
    case ERROR_KINDS.GENERAL_ERROR:
      return GENERAL_ERROR_OPTIONS
  }
}

export const GENERAL_ERROR_OPTIONS: RecoveryRoute[] = [
  RECOVERY_MAP.RESUME.ROUTE,
  RECOVERY_MAP.CANCEL_RUN.ROUTE,
]
