import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'

import {
  SPACING,
  DIRECTION_COLUMN,
  RESPONSIVENESS,
  Flex,
  StyledText,
} from '@opentrons/components'

import { TwoColumn } from '/app/molecules/InterventionModal'
import { InlineNotification } from '/app/atoms/InlineNotification'
import { RECOVERY_MAP } from '/app/organisms/ErrorRecoveryFlows/constants'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'

import type { JSX } from 'react'
import type { RecoveryContentProps } from '../types'

export function GripperReleaseLabware({
  routeUpdateActions,
}: RecoveryContentProps): JSX.Element {
  const { handleMotionRouting, goBackPrevStep } = routeUpdateActions
  const { t } = useTranslation('error_recovery')

  const buildPrimaryOnClick = (): void => {
    // Because the actual release command is executed on a delay, the execution behavior is deferred to the
    // motion route.
    void handleMotionRouting(true, RECOVERY_MAP.ROBOT_RELEASING_LABWARE.ROUTE)
  }

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <Flex css={LEFT_COL_COPY_STYLE}>
          <StyledText
            oddStyle="level4HeaderSemiBold"
            desktopStyle="headingSmallBold"
          >
            {t('release_labware_from_gripper')}
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
        <div>ANIMATION GOES HERE</div>
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
