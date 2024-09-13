import * as React from 'react'
import { css } from 'styled-components'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  RESPONSIVENESS,
} from '@opentrons/components'

import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { TwoColumn } from '../../../molecules/InterventionModal'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'
import { FailedStepNextStep } from './FailedStepNextStep'

import type { RecoveryContentProps } from '../types'

type TwoColTextAndFailedStepNextStepProps = RecoveryContentProps & {
  leftColTitle: string
  leftColBodyText: string | JSX.Element
  primaryBtnCopy: string
  primaryBtnOnClick: () => void
  secondaryBtnOnClickOverride?: () => void
}

/**
 * Left Column: Title + body text
 * Right column: FailedStepNextStep
 */
export function TwoColTextAndFailedStepNextStep(
  props: TwoColTextAndFailedStepNextStepProps
): JSX.Element | null {
  const {
    leftColBodyText,
    leftColTitle,
    primaryBtnCopy,
    primaryBtnOnClick,
    secondaryBtnOnClickOverride,
    routeUpdateActions,
  } = props
  const { goBackPrevStep } = routeUpdateActions

  return (
    <RecoverySingleColumnContentWrapper>
      <TwoColumn>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          css={css`
            gap: ${SPACING.spacing16};
            body.${RESPONSIVENESS.TOUCH_ODD_CLASS} & {
              gap: ${SPACING.spacing8};
            }
          `}
        >
          <StyledText
            oddStyle="level4HeaderSemiBold"
            desktopStyle="headingSmallBold"
          >
            {leftColTitle}
          </StyledText>
          <StyledText
            oddStyle="bodyTextRegular"
            desktopStyle="bodyDefaultRegular"
          >
            {leftColBodyText}
          </StyledText>
        </Flex>
        <FailedStepNextStep {...props} />
      </TwoColumn>
      <RecoveryFooterButtons
        primaryBtnOnClick={primaryBtnOnClick}
        primaryBtnTextOverride={primaryBtnCopy}
        secondaryBtnOnClick={secondaryBtnOnClickOverride ?? goBackPrevStep}
      />
    </RecoverySingleColumnContentWrapper>
  )
}
