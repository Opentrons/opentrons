import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'

import {
  AnimationVideo,
  DIRECTION_COLUMN,
  Flex,
  InlineNotification,
  JUSTIFY_CENTER,
  RESPONSIVENESS,
  SPACING,
  StyledText,
} from '@opentrons/components'

import gripperReleaseAnimation from '/app/assets/videos/error-recovery/Gripper_Release.webm'
import { TwoColumn } from '/app/molecules/InterventionModal'
import { RECOVERY_MAP } from '/app/organisms/ErrorRecoveryFlows/constants'

import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

import type { JSX } from 'react'
import type { RecoveryContentProps } from '../types'

export function ReleaseLabware({
  routeUpdateActions,
  recoveryMap,
}: RecoveryContentProps): JSX.Element {
  const { handleMotionRouting, goBackPrevStep } = routeUpdateActions
  const { route } = recoveryMap
  const {
    STACKER_SHUTTLE_EMPTY_RETRY,
    STACKER_SHUTTLE_EMPTY_SKIP,
  } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')

  const buildPrimaryOnClick = (): void => {
    // Because the actual release command is executed on a delay, the execution behavior is deferred to the
    // motion route.
    switch (route) {
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
        void handleMotionRouting(
          true,
          RECOVERY_MAP.ROBOT_RELEASING_LABWARE_LATCH.ROUTE
        )
        break
      default:
        void handleMotionRouting(
          true,
          RECOVERY_MAP.ROBOT_RELEASING_LABWARE.ROUTE
        )
        break
    }
  }

  const buildTitle = (): string => {
    switch (route) {
      case STACKER_SHUTTLE_EMPTY_RETRY.ROUTE:
      case STACKER_SHUTTLE_EMPTY_SKIP.ROUTE:
        return t('release_labware_from_latch')
      default:
        return t('release_labware_from_gripper')
    }
  }
  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <Flex css={LEFT_COL_COPY_STYLE}>
          <StyledText
            oddStyle="level4HeaderSemiBold"
            desktopStyle="headingSmallBold"
          >
            {buildTitle()}
          </StyledText>
          <StyledText
            oddStyle="bodyTextRegular"
            desktopStyle="bodyDefaultRegular"
          >
            {t('take_any_necessary_precautions')}
          </StyledText>
          <InlineNotification
            type="alert"
            heading={t('labware_released_from_current_height')}
          />
        </Flex>
        <Flex css={ANIMATION_CONTAINER_STYLE}>
          <AnimationVideo role="presentation" css={ANIMATION_STYLE}>
            <source
              src={gripperReleaseAnimation}
              data-testid="gripper-animation"
            />
          </AnimationVideo>
        </Flex>
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={buildPrimaryOnClick}
        primaryBtnTextOverride={t('release')}
        secondaryBtnOnClick={goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}

const LEFT_COL_COPY_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing16};

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    gap: ${SPACING.spacing24};
  }
`

const ANIMATION_CONTAINER_STYLE = css`
  justify-content: ${JUSTIFY_CENTER};
  max-height: 13.25rem;
`

const ANIMATION_STYLE = css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    width: 27rem;
    height: 20.25rem;
  }
`
