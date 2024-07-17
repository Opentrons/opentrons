import * as React from 'react'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  StyledText,
  SPACING,
  ALIGN_CENTER,
  JUSTIFY_END,
  RESPONSIVENESS,
  TEXT_ALIGN_CENTER,
} from '@opentrons/components'
import { RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR } from '@opentrons/api-client'

import {
  RecoverySingleColumnContentWrapper,
  RecoveryFooterButtons,
} from './shared'

import type { RecoveryContentProps } from './types'

export function RecoveryDoorOpen({
  recoveryActionMutationUtils,
  runStatus,
}: RecoveryContentProps): JSX.Element {
  const {
    resumeRecovery,
    isResumeRecoveryLoading,
  } = recoveryActionMutationUtils
  const { t } = useTranslation('error_recovery')

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
          name="alert-circle"
          data-testid="recovery_door_alert_icon"
        />
        <Flex css={TEXT_STYLE}>
          <StyledText
            desktopStyle="headingSmallBold"
            oddStyle="level3HeaderBold"
          >
            {t('robot_door_is_open')}
          </StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            oddStyle="level4HeaderRegular"
          >
            {t('close_the_robot_door')}
          </StyledText>
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_END}>
        <RecoveryFooterButtons
          primaryBtnOnClick={resumeRecovery}
          primaryBtnTextOverride={t('resume')}
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
