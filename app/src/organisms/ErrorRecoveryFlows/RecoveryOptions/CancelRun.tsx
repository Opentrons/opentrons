import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  StyledText,
} from '@opentrons/components'

import { RECOVERY_MAP } from '../constants'
import { RecoveryFooterButtons, RecoverySingleColumnContent } from '../shared'

import type { RecoveryContentProps } from '../types'
import type {
  RecoveryTipStatusUtils,
  UseRecoveryCommandsResult,
  UseRouteUpdateActionsResult,
} from '../hooks'

export function CancelRun({
  isOnDevice,
  routeUpdateActions,
  recoveryCommands,
  tipStatusUtils,
}: RecoveryContentProps): JSX.Element | null {
  const { t } = useTranslation('error_recovery')

  const { goBackPrevStep } = routeUpdateActions

  const { handleCancelRunClick, showBtnLoadingState } = useOnCancelRun({
    recoveryCommands,
    routeUpdateActions,
    tipStatusUtils,
  })

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent
        gridGap={SPACING.spacing24}
        alignItems={ALIGN_CENTER}
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          gridGap={SPACING.spacing24}
          height="100%"
          width="848px"
        >
          <Icon
            name="ot-alert"
            size="3.75rem"
            marginTop={SPACING.spacing24}
            color={COLORS.red50}
          />
          <StyledText as="h3Bold">
            {t('are_you_sure_you_want_to_cancel')}
          </StyledText>
          <StyledText as="h4" color={COLORS.grey60} textAlign={ALIGN_CENTER}>
            {t('if_tips_are_attached')}
          </StyledText>
        </Flex>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={handleCancelRunClick}
          secondaryBtnOnClick={goBackPrevStep}
          primaryBtnTextOverride={t('confirm')}
          isLoadingPrimaryBtnAction={showBtnLoadingState}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}

interface OnCancelRunProps {
  tipStatusUtils: RecoveryTipStatusUtils
  recoveryCommands: UseRecoveryCommandsResult
  routeUpdateActions: UseRouteUpdateActionsResult
}

// Manages routing to cancel route or drop tip route, depending on tip attachment status.
// Note that tip attachment status begins fetching in SelectRecoveryOption, but it may not finish
// by the time a user clicks "cancel run".
export function useOnCancelRun({
  tipStatusUtils,
  routeUpdateActions,
  recoveryCommands,
}: OnCancelRunProps): {
  handleCancelRunClick: () => void
  showBtnLoadingState: boolean
} {
  const { ROBOT_CANCELING, DROP_TIP_FLOWS } = RECOVERY_MAP
  const { isLoadingTipStatus, areTipsAttached } = tipStatusUtils
  const { setRobotInMotion, proceedToRouteAndStep } = routeUpdateActions
  const { cancelRun } = recoveryCommands

  const [hasUserClicked, setHasUserClicked] = React.useState(false)

  const showBtnLoadingState = hasUserClicked && isLoadingTipStatus

  React.useEffect(() => {
    if (hasUserClicked) {
      if (!isLoadingTipStatus) {
        if (areTipsAttached) {
          void proceedToRouteAndStep(DROP_TIP_FLOWS.ROUTE)
        } else {
          void setRobotInMotion(true, ROBOT_CANCELING.ROUTE).then(() => {
            cancelRun()
          })
        }
      }
    }
  }, [hasUserClicked, isLoadingTipStatus, areTipsAttached])

  const handleCancelRunClick = (): void => {
    setHasUserClicked(true)
  }

  return { showBtnLoadingState, handleCancelRunClick }
}
