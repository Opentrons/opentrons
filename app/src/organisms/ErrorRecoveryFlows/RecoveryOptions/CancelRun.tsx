import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  SPACING,
  StyledText,
  RESPONSIVENESS,
} from '@opentrons/components'

import { RECOVERY_MAP } from '../constants'
import { RecoveryFooterButtons, RecoveryContentWrapper } from '../shared'

import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'
import type {
  RecoveryTipStatusUtils,
  UseRecoveryCommandsResult,
  UseRouteUpdateActionsResult,
} from '../hooks'

export function CancelRun(props: RecoveryContentProps): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { CANCEL_RUN } = RECOVERY_MAP

  const buildContent = (): JSX.Element => {
    switch (step) {
      case CANCEL_RUN.STEPS.CONFIRM_CANCEL:
        return <CancelRunConfirmation {...props} />
      default:
        console.warn(`${step} in ${route} not explicitly handled. Rerouting.`)
        return <SelectRecoveryOption {...props} />
    }
  }

  return buildContent()
}

function CancelRunConfirmation({
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

  return (
    <RecoveryContentWrapper
      gridGap={SPACING.spacing24}
      alignItems={ALIGN_CENTER}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        gridGap={SPACING.spacing24}
        height="100%"
        css={FLEX_WIDTH}
      >
        <Icon
          name="ot-alert"
          css={ICON_SIZE}
          marginTop={SPACING.spacing24}
          color={COLORS.red50}
        />
        <StyledText oddStyle="level3HeaderBold" desktopStyle='headingSmallBold'>
          {t('are_you_sure_you_want_to_cancel')}
        </StyledText>
        <StyledText
          oddStyle="level4HeaderRegular"
          desktopStyle='bodyDefaultRegular'
          color={COLORS.grey60}
          textAlign={ALIGN_CENTER}
        >
          {t('if_tips_are_attached')}
        </StyledText>
      </Flex>
      <RecoveryFooterButtons
        primaryBtnOnClick={handleCancelRunClick}
        secondaryBtnOnClick={goBackPrevStep}
        primaryBtnTextOverride={t('confirm')}
        isLoadingPrimaryBtnAction={showBtnLoadingState}
      />
    </RecoveryContentWrapper>
  )
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

const FLEX_WIDTH = css`
  width: 666px;
  @media (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    width: 848px;
  }
`

const ICON_SIZE = css`
  width: 2.5rem;
  height: 2.5rem;
  @media (${RESPONSIVENESS.touchscreenMediaQuerySpecs}) {
    width: 3.75rem;
    height: 3.75rem;
  }
`
