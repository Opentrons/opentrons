import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  Icon,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
  TYPOGRAPHY,
  OVERFLOW_WRAP_BREAK_WORD,
  DISPLAY_FLEX,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_ALIGN_CENTER,
  StyledText,
  PrimaryButton,
  SecondaryButton,
  LargeButton,
} from '@opentrons/components'

import { useErrorName } from './hooks'
import { getErrorKind } from './utils'

import {
  BANNER_TEXT_CONTAINER_STYLE,
  BANNER_TEXT_CONTENT_STYLE,
  RECOVERY_MAP,
} from './constants'
import { RecoveryInterventionModal, StepInfo } from './shared'

import type { RobotType } from '@opentrons/shared-data'
import type { ErrorRecoveryFlowsProps } from '.'
import type {
  ERUtilsResults,
  UseRecoveryTakeoverResult,
  useRetainedFailedCommandBySource,
} from './hooks'
import type { RecoveryRoute, RouteStep } from './types'

import type { UseRecoveryAnalyticsResult } from '/app/redux-resources/analytics'

export function useRunPausedSplash(
  isOnDevice: boolean,
  showERWizard: boolean
): boolean {
  // Don't show the splash when desktop ER wizard is active,
  // but always show it on the ODD (with or without the wizard rendered above it).
  if (isOnDevice) {
    return true
  } else {
    return !showERWizard
  }
}

type RunPausedSplashProps = ERUtilsResults & {
  isOnDevice: boolean
  failedCommand: ReturnType<typeof useRetainedFailedCommandBySource>
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis']
  robotType: RobotType
  robotName: string
  toggleERWizAsActiveUser: UseRecoveryTakeoverResult['toggleERWizAsActiveUser']
  analytics: UseRecoveryAnalyticsResult<RecoveryRoute, RouteStep>
}
export function RunPausedSplash(
  props: RunPausedSplashProps
): JSX.Element | null {
  const {
    isOnDevice,
    toggleERWizAsActiveUser,
    routeUpdateActions,
    failedCommand,
    analytics,
    robotName,
  } = props
  const { t } = useTranslation('error_recovery')
  const errorKind = getErrorKind(failedCommand?.byRunRecord ?? null)
  const title = useErrorName(errorKind)

  const { proceedToRouteAndStep } = routeUpdateActions
  const { reportErrorEvent } = analytics

  const buildTitleHeadingDesktop = (): JSX.Element => {
    return (
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('error_on_robot', { robot: robotName })}
      </StyledText>
    )
  }

  // Do not launch error recovery, but do utilize the wizard's cancel route.
  const onCancelClick = (): Promise<void> => {
    return toggleERWizAsActiveUser(true, false).then(() => {
      reportErrorEvent(failedCommand?.byRunRecord ?? null, 'cancel-run')
      void proceedToRouteAndStep(RECOVERY_MAP.CANCEL_RUN.ROUTE)
    })
  }

  const onLaunchERClick = (): Promise<void> => {
    return toggleERWizAsActiveUser(true, true).then(() => {
      reportErrorEvent(failedCommand?.byRunRecord ?? null, 'launch-recovery')
    })
  }

  // TODO(jh 05-22-24): The hardcoded Z-indexing is non-ideal but must be done to keep the splash page above
  // several components in the RunningProtocol page. Investigate why these components have seemingly arbitrary zIndex values
  // and devise a better solution to layering modals.

  // TODO(jh 06-07-24): Although unlikely, it's possible that the server doesn't return a failedCommand. Need to handle
  // this here or within ER flows.

  // TODO(jh 06-18-24): Instead of passing stepCount internally, we probably want to
  // pass it in as a prop to ErrorRecoveryFlows to ameliorate blippy "step = ? -> step = 24" behavior.
  if (isOnDevice) {
    return (
      <Flex
        display={DISPLAY_FLEX}
        height="100vh"
        width="100%"
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        position={POSITION_ABSOLUTE}
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing60}
        padding={SPACING.spacing40}
        backgroundColor={COLORS.red50}
        zIndex={5}
      >
        <SplashFrame>
          <Flex gridGap={SPACING.spacing32} alignItems={ALIGN_CENTER}>
            <Icon name="ot-alert" size="4.5rem" color={COLORS.white} />
            <SplashHeader>{title}</SplashHeader>
          </Flex>
          <Flex width="100%" justifyContent={JUSTIFY_CENTER}>
            <StepInfo
              {...props}
              oddStyle="level3HeaderBold"
              overflow="hidden"
              overflowWrap={OVERFLOW_WRAP_BREAK_WORD}
              color={COLORS.white}
              textAlign={TEXT_ALIGN_CENTER}
            />
          </Flex>
        </SplashFrame>
        <Flex
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          gridGap={SPACING.spacing16}
        >
          <LargeButton
            onClick={onCancelClick}
            buttonText={t('cancel_run')}
            css={SHARED_BUTTON_STYLE_ODD}
            iconName={'remove'}
            buttonType="alertAlt"
          />
          <LargeButton
            onClick={onLaunchERClick}
            buttonText={t('launch_recovery_mode')}
            css={SHARED_BUTTON_STYLE_ODD}
            iconName={'recovery'}
            buttonType="alertStroke"
          />
        </Flex>
      </Flex>
    )
  } else {
    return (
      <RecoveryInterventionModal
        desktopType="desktop-small"
        titleHeading={buildTitleHeadingDesktop()}
        isOnDevice={false}
      >
        <Flex css={BANNER_TEXT_CONTAINER_STYLE}>
          <Flex css={BANNER_TEXT_CONTENT_STYLE}>
            <Icon
              name="ot-alert"
              size={SPACING.spacing40}
              color={COLORS.red50}
            />
            <Flex
              gridGap={SPACING.spacing8}
              flexDirection={DIRECTION_COLUMN}
              alignItems={ALIGN_CENTER}
              width="100%"
            >
              <StyledText desktopStyle="headingSmallBold">{title}</StyledText>
              <StepInfo
                {...props}
                desktopStyle="bodyDefaultRegular"
                overflow="hidden"
                overflowWrap={OVERFLOW_WRAP_BREAK_WORD}
                textAlign={TEXT_ALIGN_CENTER}
              />
            </Flex>
          </Flex>
          <Flex gridGap={SPACING.spacing8} marginLeft="auto">
            <SecondaryButton isDangerous onClick={onCancelClick}>
              {t('cancel_run')}
            </SecondaryButton>
            <PrimaryButton
              onClick={onLaunchERClick}
              css={PRIMARY_BTN_STYLES_DESKTOP}
            >
              <StyledText desktopStyle="bodyDefaultSemiBold">
                {t('launch_recovery_mode')}
              </StyledText>
            </PrimaryButton>
          </Flex>
        </Flex>
      </RecoveryInterventionModal>
    )
  }
}

const SplashHeader = styled.h1`
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  text-align: ${TYPOGRAPHY.textAlignCenter};
  font-size: ${TYPOGRAPHY.fontSize80};
  line-height: ${TYPOGRAPHY.lineHeight96};
  color: ${COLORS.white};
`

const SplashFrame = styled(Flex)`
  width: 100%;
  height: 100%;
  flex-direction: ${DIRECTION_COLUMN};
  justify-content: ${JUSTIFY_CENTER};
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing40};
  padding-bottom: 0px;
`

const SHARED_BUTTON_STYLE_ODD = css`
  width: 29rem;
  height: 13.5rem;
`

const PRIMARY_BTN_STYLES_DESKTOP = css`
  background-color: ${COLORS.red50};
  color: ${COLORS.white};

  &:active,
  &:focus,
  &:hover {
    background-color: ${COLORS.red55};
  }
`
