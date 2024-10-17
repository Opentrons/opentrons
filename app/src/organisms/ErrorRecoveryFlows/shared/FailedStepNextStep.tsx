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

  const nthStepAfter = (n: number): number | undefined =>
    stepCounts.currentStepNumber == null
      ? undefined
      : stepCounts.currentStepNumber + n
  const nthCommand = (n: number): typeof failedCommandByAnalysis =>
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
