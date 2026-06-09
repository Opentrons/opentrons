import type { CommandData } from '@opentrons/api-client'
import type { DocumentationState } from '@opentrons/react-api-client'
import type { CreateCommand } from '@opentrons/shared-data'
import type { UseLPCCommandsProps } from '.'

export interface UseLPCCommandChildProps extends UseLPCCommandsProps {
  commandDocState: DocumentationState
}

export interface UseLPCCommandWithChainRunChildProps extends UseLPCCommandChildProps {
  chainLPCCommands: (
    commands: CreateCommand[],
    continuePastCommandFailure: boolean,
    shouldPropogateError?: boolean
  ) => Promise<CommandData[]>
}
