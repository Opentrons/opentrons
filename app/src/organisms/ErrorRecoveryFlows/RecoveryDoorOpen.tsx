import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import { RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_END,
  RESPONSIVENESS,
  SPACING,
  StyledText,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'

import { RECOVERY_MAP } from './constants'
import {
  RecoveryFooterButtons,
  RecoverySingleColumnContentWrapper,
} from './shared'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from './types'

// There are two code paths that render this component:
// 1) The door is open on a route & step in which it is not permitted to have the door open.
// 2) The door is open on a route & step in which it is permitted to have the door open, but the app manually redirects
// to this component. This is commonly done when the route & step itself allows the user to keep the door open, but some
// action on that route & step is about to occur that requires the door to be closed. In this case, once the door event
// has been satisfied, manually route back to the previous route & step.
// in case you need a custom "close the robot door" use RecoveryDoorOpenSpecial compnent with allowDoorOpen metadata set to true
export function RecoveryDoorOpen({
  recoveryActionMutationUtils,
  runStatus,
  routeUpdateActions,
  recoveryMap,
  recoveryCommands,
  currentRecoveryOptionUtils,
}: RecoveryContentProps): ReactNode {
  const { resumeRecovery, isResumeRecoveryLoading } =
    recoveryActionMutationUtils
  const { stashedMap, proceedToRouteAndStep } = routeUpdateActions
  const { selectedRecoveryOption } = currentRecoveryOptionUtils
  const { t } = useTranslation('error_recovery')

  const primaryOnClick = (): void => {
    void resumeRecovery().then(() => {
      // See comments above for why we do this.
      if (stashedMap != null) {
        void proceedToRouteAndStep(stashedMap.route, stashedMap.step)
      }
    })
  }

  const buildSubtext = (): string => {
    switch (selectedRecoveryOption) {
      case RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE:
      case RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE:
      case RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
      case RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_RELEASING_LABWARE_LATCH.ROUTE:
        return t('stacker_door_open_robot_home')
      default:
        return t('close_the_robot_door')
    }
  }

  const buildTitleText = (): string => {
    switch (selectedRecoveryOption) {
      case RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE:
      case RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE:
      case RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
      case RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_RELEASING_LABWARE_LATCH.ROUTE:
        return t('close_robot_and_stacker_door')
      default:
        return t('confirm_robot_door_is_closed')
    }
  }

  const buildPrimaryButtonText = (): string => {
    switch (recoveryMap.route) {
      case RECOVERY_MAP.STACKER_STALLED_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_HOPPER_EMPTY_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE:
      case RECOVERY_MAP.STACKER_SHUTTLE_MISSING_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE:
      case RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
      case RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case RECOVERY_MAP.STACKER_RELEASING_LABWARE_LATCH.ROUTE:
        return t('continue')
      default:
        return t('confirm')
    }
  }

  return (
    <RecoverySingleColumnContentWrapper>
      <Flex
        padding={SPACING.spacing40}
        gridGap={SPACING.spacing24}
        flexDirection={DIRECTION_COLUMN}
        alignItems={ALIGN_CENTER}
        justifyContent={ALIGN_CENTER}
        flex="1"
      >
        <Icon
          css={ICON_STYLE}
          name="ot-alert"
          data-testid="recovery_door_alert_icon"
        />
        <Flex css={TEXT_STYLE}>
          <StyledText
            desktopStyle="headingSmallBold"
            oddStyle="level3HeaderBold"
          >
            {buildTitleText()}
          </StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            oddStyle="level4HeaderRegular"
          >
            {buildSubtext()}
          </StyledText>
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_END}>
        <RecoveryFooterButtons
          primaryBtnOnClick={primaryOnClick}
          primaryBtnTextOverride={buildPrimaryButtonText()}
          primaryBtnDisabled={
            runStatus === RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR
          }
          isLoadingPrimaryBtnAction={isResumeRecoveryLoading}
        />
      </Flex>
    </RecoverySingleColumnContentWrapper>
  )
}

const TEXT_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing8};
  align-items: ${ALIGN_CENTER};
  text-align: ${TEXT_ALIGN_CENTER};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing4};
  }
`

const ICON_STYLE = css`
  height: ${SPACING.spacing40};
  width: ${SPACING.spacing40};
  color: ${COLORS.yellow50};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    height: ${SPACING.spacing60};
    width: ${SPACING.spacing60};
  }
`
