import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import type { GroupedCommands } from './types'

export const getGroupedCommands = (
  mostRecentAnalysis: ProtocolAnalysisOutput | CompletedProtocolAnalysis
): GroupedCommands => {
  const annotations = mostRecentAnalysis?.commandAnnotations ?? []

  // optional: build lookup map for annotation metadata
  const annotationMap = new Map(annotations.map(a => [a.annotationId, a]))

  return mostRecentAnalysis.commands.reduce<GroupedCommands>(
    (acc: GroupedCommands, c: RunTimeCommand) => {
      const annotationId = c.commandAnnotations?.[0] // assuming single annotation per command

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
              { command: c, isHighlighted: false },
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
            annotation: annotationMap.get(annotationId), // optional metadata
            subCommands: [{ command: c, isHighlighted: false }],
            isHighlighted: false,
          },
        ]
      }

      return [...acc, { command: c, isHighlighted: false }]
    },
    []
  )
}
