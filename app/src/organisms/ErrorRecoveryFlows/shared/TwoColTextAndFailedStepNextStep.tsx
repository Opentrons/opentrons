import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { css } from 'styled-components'
import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
  RESPONSIVENESS,
} from '@opentrons/components'

import { RecoveryContentWrapper } from './RecoveryContentWrapper'
import {
  TwoColumn,
  CategorizedStepContent,
} from '../../../molecules/InterventionModal'
import { RecoveryFooterButtons } from './RecoveryFooterButtons'

import type { RecoveryContentProps } from '../types'

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
  failedCommand,
  stepCounts,
  commandsAfterFailedCommand,
  protocolAnalysis,
  robotType,
}: TwoColTextAndFailedStepNextStepProps): JSX.Element | null {
  const { goBackPrevStep } = routeUpdateActions
  const { t } = useTranslation('error_recovery')
  const nthStepAfter = (n: number): number | undefined =>
    stepCounts.currentStepNumber == null
      ? undefined
      : stepCounts.currentStepNumber + n
  const commandsAfter = [
    commandsAfterFailedCommand.length > 0
      ? commandsAfterFailedCommand[0] == null
        ? null
        : { command: commandsAfterFailedCommand[0], index: nthStepAfter(1) }
      : null,
    commandsAfterFailedCommand.length > 1
      ? commandsAfterFailedCommand[1] == null
        ? null
        : { command: commandsAfterFailedCommand[1], index: nthStepAfter(2) }
      : null,
  ] as const
  return (
    <RecoveryContentWrapper>
      <TwoColumn>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          css={css`
            gap=${SPACING.spacing16};
            @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
               gap=${SPACING.spacing8}
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
        <CategorizedStepContent
          commandTextData={protocolAnalysis}
          robotType={robotType}
          topCategoryHeadline={t('failed_step')}
          topCategory="failed"
          topCategoryCommand={
            failedCommand == null
              ? null
              : {
                  command: failedCommand,
                  index: stepCounts.currentStepNumber ?? undefined,
                }
          }
          bottomCategoryHeadline={t('next_step')}
          bottomCategory="future"
          bottomCategoryCommands={commandsAfter}
        />
      </TwoColumn>
      <RecoveryFooterButtons
        isOnDevice={isOnDevice}
        primaryBtnOnClick={primaryBtnOnClick}
        primaryBtnTextOverride={primaryBtnCopy}
        secondaryBtnOnClick={secondaryBtnOnClickOverride ?? goBackPrevStep}
      />
    </RecoveryContentWrapper>
  )
}
