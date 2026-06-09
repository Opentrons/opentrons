import type { CommandData } from '@opentrons/api-client'
import type {
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import type { UseLPCCommandsProps } from '.'

export interface UseLPCCommandChildProps extends UseLPCCommandsProps {
  commandDocState: DocumentationState
  actionsToDocument: DocumentedAction[]
  addActionToDocument: (action: DocumentedAction) => void
}

export interface UseLPCCommandWithChainRunChildProps extends UseLPCCommandChildProps {
  chainLPCCommands: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean,
    shouldPropogateError?: boolean
  ) => Promise<CommandData[]>
}
