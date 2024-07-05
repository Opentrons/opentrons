import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  LegacyStyledText,
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
  if (isOnDevice) {
    return (
      <RecoveryContentWrapper>
        <TwoColumn>
          <Flex gridGap={SPACING.spacing8} flexDirection={DIRECTION_COLUMN}>
            <LegacyStyledText as="h4SemiBold">{leftColTitle}</LegacyStyledText>
            {leftColBodyText}
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
  } else {
    return null
  }
}
