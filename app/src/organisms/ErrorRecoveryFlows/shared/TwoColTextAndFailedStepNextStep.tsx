import * as React from 'react'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
} from '@opentrons/components'

import { RecoverySingleColumnContent } from './RecoverySingleColumnContent'
import { TwoColumn } from '../../../molecules/InterventionModal'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

import type { RecoveryContentProps } from '../types'
import { FailedStepNextStep } from './FailedStepNextStep'

type TwoColTextAndFailedStepNextStepProps = RecoveryContentProps & {
  leftColTitle: string
  leftColBodyText: string | JSX.Element
  primaryBtnCopy: string
  primaryBtnOnClick: () => void
  secondaryBtnOnClickOverride?: () => void
  secondaryBtnOnClickCopyOverride?: string
}

/**
 * Left Column: Title + body text
 * Right column: FailedStepNextStep
 */
export function TwoColTextAndFailedStepNextStep({
  leftColBodyText,
  leftColTitle,
  primaryBtnCopy,
  primaryBtnOnClick,
  secondaryBtnOnClickOverride,
  secondaryBtnOnClickCopyOverride,
  isOnDevice,
  routeUpdateActions,
  ...rest
}: TwoColTextAndFailedStepNextStepProps): JSX.Element | null {
  const { goBackPrevStep } = routeUpdateActions

  if (isOnDevice) {
    return (
      <RecoverySingleColumnContent>
        <TwoColumn>
          <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
            <LegacyStyledText as="h4SemiBold">{leftColTitle}</LegacyStyledText>
            {leftColBodyText}
          </Flex>
          <FailedStepNextStep
            {...rest}
            isOnDevice={isOnDevice}
            routeUpdateActions={routeUpdateActions}
          />
        </TwoColumn>
        <RecoveryFooterButtons
          isOnDevice={isOnDevice}
          primaryBtnOnClick={primaryBtnOnClick}
          primaryBtnTextOverride={primaryBtnCopy}
          secondaryBtnOnClick={secondaryBtnOnClickOverride ?? goBackPrevStep}
        />
      </RecoverySingleColumnContent>
    )
  } else {
    return null
  }
}
