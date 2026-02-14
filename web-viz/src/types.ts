import type { RunTimeCommand } from '@opentrons/shared-data'

interface ParentNode {
  annotationIndex: number
  subCommands: LeafNode[]
  isHighlighted: boolean
}

export interface LeafNode {
  command: RunTimeCommand
  isHighlighted: boolean
}

export type GroupedCommands = Array<LeafNode | ParentNode>
