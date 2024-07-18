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
  BORDERS,
  DIRECTION_COLUMN,
  POSITION_ABSOLUTE,
  TYPOGRAPHY,
  OVERFLOW_WRAP_BREAK_WORD,
  DISPLAY_FLEX,
  JUSTIFY_SPACE_BETWEEN,
  TEXT_ALIGN_CENTER,
  StyledText,
  JUSTIFY_END,
  PrimaryButton,
  ALIGN_FLEX_END,
  SecondaryButton,
} from '@opentrons/components'

import { useErrorName } from './hooks'
import { getErrorKind } from './utils'
import { LargeButton } from '../../atoms/buttons'
import { RECOVERY_MAP } from './constants'
import {
  RecoveryInterventionModal,
  RecoverySingleColumnContentWrapper,
  StepInfo,
} from './shared'

import type { RobotType } from '@opentrons/shared-data'
import type { ErrorRecoveryFlowsProps } from '.'
import type { ERUtilsResults } from './hooks'
import { useHost } from '@opentrons/react-api-client'

export function useRunPausedSplash(
  isOnDevice: boolean,
  showERWizard: boolean
): boolean {
  // Don't show the splash when desktop ER wizard is active,
  // but always show it on the ODD (with or without the wizard rendered above it).
  return !(!isOnDevice && showERWizard)
}

type RunPausedSplashProps = ERUtilsResults & {
  isOnDevice: boolean
  failedCommand: ErrorRecoveryFlowsProps['failedCommand']
  protocolAnalysis: ErrorRecoveryFlowsProps['protocolAnalysis']
  robotType: RobotType
  toggleERWiz: (launchER: boolean) => Promise<void>
}
export function RunPausedSplash(
  props: RunPausedSplashProps
): JSX.Element | null {
  const { isOnDevice, toggleERWiz, routeUpdateActions, failedCommand } = props
  const { t } = useTranslation('error_recovery')
  const errorKind = getErrorKind(failedCommand)
  const title = useErrorName(errorKind)
  const host = useHost()

  const { proceedToRouteAndStep } = routeUpdateActions

  const buildTitleHeadingDesktop = (): JSX.Element => {
    return (
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('error_on_robot', { robot: host?.robotName ?? '' })}
      </StyledText>
    )
  }

  // Do not launch error recovery, but do utilize the wizard's cancel route.
  const onCancelClick = (): Promise<void> => {
    return toggleERWiz(false).then(() =>
      proceedToRouteAndStep(RECOVERY_MAP.CANCEL_RUN.ROUTE)
    )
  }

  const onLaunchERClick = (): Promise<void> => toggleERWiz(true)

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
        paddingY={SPACING.spacing40}
        backgroundColor={COLORS.red50}
        zIndex={5}
      >
        <SplashFrame>
          <Flex gridGap={SPACING.spacing32} alignItems={ALIGN_CENTER}>
            <Icon name="ot-alert" size="4.5rem" color={COLORS.white} />
            <SplashHeader>{title}</SplashHeader>
          </Flex>
          <Flex width="49rem" justifyContent={JUSTIFY_CENTER}>
            <StepInfo
              {...props}
              textStyle="level3HeaderBold"
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
        isOnDevice={isOnDevice}
      >
        <RecoverySingleColumnContentWrapper>
          <Flex
            gridGap={SPACING.spacing24}
            flexDirection={DIRECTION_COLUMN}
            alignItems={ALIGN_FLEX_END}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Flex
              borderRadius={BORDERS.borderRadius8}
              padding={`${SPACING.spacing40} ${SPACING.spacing16}`}
              gridGap={SPACING.spacing16}
              height="100%"
              flexDirection={DIRECTION_COLUMN}
              justifyContent={JUSTIFY_CENTER}
              alignItems={ALIGN_CENTER}
            >
              <Icon
                name="ot-alert"
                size={SPACING.spacing40}
                color={COLORS.red50}
              />
              <Flex
                gridGap={SPACING.spacing8}
                flexDirection={DIRECTION_COLUMN}
                alignItems={ALIGN_CENTER}
              >
                <StyledText desktopStyle="headingSmallBold">{title}</StyledText>
                <StepInfo
                  {...props}
                  textStyle="bodyDefaultRegular"
                  overflow="hidden"
                  overflowWrap={OVERFLOW_WRAP_BREAK_WORD}
                  textAlign={TEXT_ALIGN_CENTER}
                />
              </Flex>
            </Flex>
          </Flex>
          <Flex
            gridGap={SPACING.spacing8}
            justifyContent={JUSTIFY_END}
            alignItems={ALIGN_CENTER}
          >
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
        </RecoverySingleColumnContentWrapper>
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
  padding: ${SPACING.spacing24};
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
