import * as React from 'react'
import styled, { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

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
} from '@opentrons/components'

import { getIsOnDevice } from '../../redux/config'
import { getErrorKind, useErrorMessage, useErrorName } from './hooks'
import { LargeButton } from '../../atoms/buttons'
import { RECOVERY_MAP } from './constants'

import type { FailedCommand } from './types'
import type { UseRouteUpdateActionsResult } from './hooks'

export function useRunPausedSplash(): boolean {
  return useSelector(getIsOnDevice)
}

interface RunPausedSplashProps {
  toggleERWiz: (launchER: boolean) => Promise<void>
  routeUpdateActions: UseRouteUpdateActionsResult
  failedCommand: FailedCommand | null
}
export function RunPausedSplash({
  toggleERWiz,
  routeUpdateActions,
  failedCommand,
}: RunPausedSplashProps): JSX.Element {
  const { t } = useTranslation('error_recovery')
  const errorKind = getErrorKind(failedCommand?.error?.errorType)
  const title = useErrorName(errorKind)
  const subText = useErrorMessage(errorKind)

  const { proceedToRouteAndStep } = routeUpdateActions

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
        <Flex width="49rem" justifyContent={JUSTIFY_CENTER}>
          <SplashBody>{subText}</SplashBody>
        </Flex>
      </SplashFrame>
      <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} gridGap={SPACING.spacing16}>
        <LargeButton
          onClick={onCancelClick}
          buttonText={t('cancel_run')}
          css={SHARED_BUTTON_STYLE}
          iconName={'remove'}
          buttonType="alertAlt"
        />
        <LargeButton
          onClick={onLaunchERClick}
          buttonText={t('launch_recovery_mode')}
          css={SHARED_BUTTON_STYLE}
          iconName={'recovery'}
          buttonType="onColor"
        />
      </Flex>
    </Flex>
  )
}

const SplashHeader = styled.h1`
  font-weight: ${TYPOGRAPHY.fontWeightBold};
  text-align: ${TYPOGRAPHY.textAlignLeft};
  font-size: ${TYPOGRAPHY.fontSize80};
  line-height: ${TYPOGRAPHY.lineHeight96};
  color: ${COLORS.white};
`
const SplashBody = styled.h4`
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 4;
  overflow: hidden;
  overflow-wrap: ${OVERFLOW_WRAP_BREAK_WORD};
  font-weight: ${TYPOGRAPHY.fontWeightSemiBold};
  text-align: ${TYPOGRAPHY.textAlignCenter};
  text-transform: ${TYPOGRAPHY.textTransformCapitalize};
  font-size: ${TYPOGRAPHY.fontSize32};
  line-height: ${TYPOGRAPHY.lineHeight42};
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

const SHARED_BUTTON_STYLE = css`
  width: 29rem;
  height: 13.5rem;
`
