import { css } from 'styled-components'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  RESPONSIVENESS,
} from '@opentrons/components'

import { RecoverySingleColumnContentWrapper } from './RecoveryContentWrapper'
import { TwoColumn } from '/app/molecules/InterventionModal'
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

// TODO(jh, 10-01-24): In some views we inject copy and in others, we derive it in the view based on
//  selected recovery option.

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
            gap: ${SPACING.spacing8};
            @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
              gap: ${SPACING.spacing12};
            }
          `}
        >
          <StyledText
            oddStyle="level4HeaderSemiBold"
            desktopStyle="headingSmallBold"
          >
            {leftColTitle}
          </StyledText>
          {typeof leftColBodyText === 'string' ? (
            <StyledText
              oddStyle="bodyTextRegular"
              desktopStyle="bodyDefaultRegular"
            >
              {leftColBodyText}
            </StyledText>
          ) : (
            leftColBodyText
          )}
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
