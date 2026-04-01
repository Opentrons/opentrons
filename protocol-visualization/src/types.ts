import type { RunTimeCommand } from '@opentrons/shared-data'
import type { CommandAnnotationV2 } from '@opentrons/shared-data/commandAnnotation/types'

export interface ParentNode {
  annotationId: string
  subCommands: LeafNode[]
  isHighlighted: boolean
  annotation?: CommandAnnotationV2
}

export interface LeafNode {
  command: RunTimeCommand
  isHighlighted: boolean
}

export type GroupedCommands = Array<LeafNode | ParentNode>
