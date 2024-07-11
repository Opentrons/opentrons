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
  const nthCommand = (n: number): typeof failedCommand =>
    commandsAfterFailedCommand != null
      ? n < commandsAfterFailedCommand.length
        ? commandsAfterFailedCommand[n]
        : null
      : null

  const commandsAfter = [nthCommand(0), nthCommand(1)] as const

  const indexedCommandsAfter = [
    commandsAfter[0] != null
      ? { command: commandsAfter[0], index: nthStepAfter(1) }
      : null,
    commandsAfter[1] != null
      ? { command: commandsAfter[1], index: nthStepAfter(2) }
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
          bottomCategoryCommands={indexedCommandsAfter}
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
