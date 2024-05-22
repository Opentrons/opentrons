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
} from '@opentrons/components'

import type { FailedCommand } from './types'
import { getErrorKind, useErrorMessage, useErrorName } from './utils'
import { LargeButton } from '../../atoms/buttons'

interface RunPausedSplashProps {
  onClick: () => void
  failedCommand: FailedCommand | null
}

export function RunPausedSplash({
  onClick,
  failedCommand,
}: RunPausedSplashProps): JSX.Element {
  const { t } = useTranslation('error_recovery')
  const errorKind = getErrorKind(failedCommand?.error?.errorType)
  const title = useErrorName(errorKind)
  const subText = useErrorMessage(errorKind)

  // TODO(jh 05-22-24): The hardcoded Z-indexing is non-ideal but must be done to keep the splash page above
  // several components in the RunningProtocol page. Investigate why these components have seemingly arbitrary zIndex values
  // and devise a better solution to layering modals.
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
          onClick={() => null}
          buttonText={t('cancel_run')}
          css={CANCEL_RUN_BTN_STYLE}
          iconName={'remove'}
          iconColorOverride={COLORS.red50}
        />
        <LargeButton
          onClick={() => null}
          buttonText={t('launch_recovery_mode')}
          css={LAUNCH_RECOVERY_BTN_STYLE}
          iconName={'recovery'}
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

const SHARED_BUTTON_STYLE = `
width: 464px;
height: 216px;
`

const LAUNCH_RECOVERY_BTN_STYLE = css`
  ${SHARED_BUTTON_STYLE};
  background-color: transparent;
  border: 4px solid ${COLORS.white};

  &:hover {
    background-color: transparent;
    border: 4px solid ${COLORS.white};
  }
  &:active {
    background-color: transparent;
    border: 4px solid ${COLORS.white};
  }
  &:focus-visible {
    background-color: transparent;
    border: 4px solid ${COLORS.white};
  }
`

const CANCEL_RUN_BTN_STYLE = css`
  ${SHARED_BUTTON_STYLE};
  color: ${COLORS.red50};
  background-color: ${COLORS.white};

  &:hover {
    color: ${COLORS.red50};
    background-color: ${COLORS.white};
  }
  &:active {
    color: ${COLORS.red50};
    background-color: ${COLORS.white};
  }
  &:focus-visible {
    color: ${COLORS.red50};
    background-color: ${COLORS.white};
  }
`
