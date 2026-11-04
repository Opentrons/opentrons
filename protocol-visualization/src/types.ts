import type { RunTimeCommand } from '@opentrons/shared-data'
import type { CommandAnnotationV2 } from '@opentrons/shared-data/commandAnnotation/types'

interface ParentNode {
  annotationId: string
  subCommands: LeafNode[]
  isHighLighted: boolean
  annotation?: CommandAnnotationV2
}

export interface LeafNode {
  command: RunTimeCommand
  isHighlighted: boolean
}

export type GroupedCommands = Array<LeafNode | ParentNode>
