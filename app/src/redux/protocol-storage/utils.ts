import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { CommandAnnotationV2 } from '@opentrons/shared-data/commandAnnotation/types'
import type { GroupedCommands } from './types'

export const getGroupedCommands = (
  mostRecentAnalysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
): GroupedCommands => {
  const annotations = mostRecentAnalysis?.commandAnnotations ?? []

  // we won't support showing the command annotations if they are schema V1
  if (
    annotations.some(
      a =>
        a.annotationType === 'secondOrderCommand' ||
        a.annotationType === 'custom'
    )
  ) {
    return []
  } else {
    const annotationsV2 = annotations as CommandAnnotationV2[]
    const annotationMap = new Map(
      annotationsV2.map(annotation => [annotation.id, annotation])
    )

    return mostRecentAnalysis.commands.reduce<GroupedCommands>(
      (acc: GroupedCommands, command: RunTimeCommand) => {
        const annotationId = command.commandAnnotationIds?.[0]

        const lastAccNode = acc[acc.length - 1]

        if (
          lastAccNode != null &&
          annotationId != null &&
          'annotationId' in lastAccNode &&
          lastAccNode.annotationId === annotationId
        ) {
          return [
            ...acc.slice(0, -1),
            {
              ...lastAccNode,
              subCommands: [
                ...lastAccNode.subCommands,
                { command: command, isHighlighted: false },
              ],
              isHighlighted: false,
            },
          ]
        }

        if (annotationId != null) {
          return [
            ...acc,
            {
              annotationId,
              annotation: annotationMap.get(annotationId),
              subCommands: [{ command, isHighlighted: false }],
              isHighlighted: false,
            },
          ]
        }

        return [...acc, { command, isHighlighted: false }]
      },
      []
    )
  }
}
