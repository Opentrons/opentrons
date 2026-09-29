import { useTranslation } from 'react-i18next'

import { CategorizedStepContent } from '/app/molecules/InterventionModal'

import type { RecoveryContentProps } from '../types'

export function FailedStepNextStep({
  stepCounts,
  failedCommand,
  commandsAfterFailedCommand,
  protocolAnalysis,
  robotType,
  allRunDefs,
}: Pick<
  RecoveryContentProps,
  | 'stepCounts'
  | 'failedCommand'
  | 'commandsAfterFailedCommand'
  | 'protocolAnalysis'
  | 'robotType'
  | 'allRunDefs'
>): JSX.Element {
  const { t } = useTranslation('error_recovery')
  const failedCommandByAnalysis = failedCommand?.byAnalysis ?? null
  const nextCommand = commandsAfterFailedCommand?.[0] ?? null
  const nextStepNumber =
    stepCounts.currentStepNumber == null
      ? undefined
      : stepCounts.currentStepNumber + 1
  const indexedCommandsAfter = [
    nextCommand != null
      ? { command: nextCommand, index: nextStepNumber }
      : null,
    null,
  ] as const

  return (
    <CategorizedStepContent
      commandTextData={protocolAnalysis}
      allRunDefs={allRunDefs}
      robotType={robotType}
      topCategoryHeadline={t('failed_step')}
      topCategory="failed"
      topCategoryCommand={
        failedCommandByAnalysis == null
          ? null
          : {
              command: failedCommandByAnalysis,
              index: stepCounts.currentStepNumber ?? undefined,
            }
      }
      bottomCategoryHeadline={t('next_step')}
      bottomCategory="future"
      bottomCategoryCommands={indexedCommandsAfter}
    />
  )
}
