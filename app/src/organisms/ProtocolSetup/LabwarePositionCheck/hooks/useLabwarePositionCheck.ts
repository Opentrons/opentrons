import * as React from 'react'
import {
  HostConfig,
  SessionCommandSummary,
  createCommand,
} from '@opentrons/api-client'
import {
  useHost,
  useEnsureBasicRun,
  useAllCommandsQuery,
} from '@opentrons/react-api-client'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import { useSteps } from '.'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
import type {
  LoadLabwareCommand,
  LoadModuleCommand,
  SetupCommand,
} from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type {
  Axis,
  Jog,
  Sign,
  StepSize,
} from '../../../../molecules/JogControls/types'

type LabwarePositionCheckUtils =
  | {
      currentCommandIndex: number
      isLoading: boolean
      isComplete: boolean
      proceed: () => void
      jog: Jog
      ctaText: string
    }
  | { error: Error }

const useLpcCtaText = (command: Command): string => {
  const { protocolData } = useProtocolDetails()
  const commands = protocolData?.commands ?? []
  switch (command.commandType) {
    case 'moveToWell': {
      const labwareId = command.params.labwareId
      const loadLabwareCommand = commands.find(
        (command: Command) =>
          command.commandType === 'loadLabware' &&
          command.params.labwareId === labwareId
      ) as LoadLabwareCommand
      // @ts-expect-error we know slotName exists on params.location because the loadLabware command was loaded using the slotName, not moduleId
      const slot = loadLabwareCommand.params.location.slotName
      return `Confirm position, move to slot ${slot}`
    }
    case 'thermocycler/openLid': {
      const moduleId = command.params.moduleId
      const loadModuleCommand = commands.find(
        (command: Command) =>
          command.commandType === 'loadModule' &&
          command.params.moduleId === moduleId
      ) as LoadModuleCommand
      const slot = loadModuleCommand.params.location.slotName
      return `Confirm position, move to slot ${slot}`
    }
    case 'pickUpTip': {
      return `Confirm position, pick up tip`
    }
    case 'dropTip': {
      const labwareId = command.params.labwareId
      const loadLabwareCommand = commands.find(
        (command: Command) =>
          command.commandType === 'loadLabware' &&
          command.params.labwareId === labwareId
      ) as LoadLabwareCommand
      // @ts-expect-error we know slotName exists on params.location because the loadLabware command was loaded using the slotName, not moduleId
      const slot = loadLabwareCommand.params.location.slotName
      return `Confirm position, return tip to slot ${slot}`
    }
    default:
      return ''
  }
}

const commandIsComplete = (status: SessionCommandSummary['status']): boolean =>
  status === 'succeeded' || status === 'failed'

const createCommandData = (
  command: Command
): { commandType: string; data: Record<string, any> } => ({
  commandType: command.commandType,
  data: command.params,
})

const isLoadCommand = (command: Command): boolean => {
  const loadCommands: Array<SetupCommand['commandType']> = [
    'loadLabware',
    'loadLiquid',
    'loadModule',
    'loadPipette',
  ]
  // @ts-expect-error SetupCommand is more specific than Command, but the whole point of this util :)
  return loadCommands.includes(command.commandType)
}

const isTCOpenCommand = (command: Command): boolean =>
  command.commandType === 'thermocycler/openLid'

export function useLabwarePositionCheck(
  addSavePositionCommandId: (commandId: string) => void
): LabwarePositionCheckUtils {
  const [currentCommandIndex, setCurrentCommandIndex] = React.useState<number>(
    0
  )
  const [pendingCommandId, setPendingCommandId] = React.useState<string | null>(
    null
  )
  const [
    prepCommandsExecuted,
    setPrepCommandsExecuted,
  ] = React.useState<boolean>(false)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<Error | null>(null)
  const { protocolData } = useProtocolDetails()
  const host = useHost()
  const basicRun = useEnsureBasicRun()
  if (basicRun.error != null && error !== null) {
    setError(basicRun.error)
  }

  const loadCommands = protocolData?.commands.filter(isLoadCommand) ?? []
  const TCOpenCommands = protocolData?.commands.filter(isTCOpenCommand) ?? []
  const prepCommands = [...loadCommands, ...TCOpenCommands]
  const LPCMovementCommands = useSteps()
    .reduce<Command[]>((steps, currentStep) => {
      return [...steps, ...currentStep.commands]
    }, [])
    .filter(
      (command: Command) => command.commandType !== 'thermocycler/openLid'
    )
  const currentCommand = LPCMovementCommands[currentCommandIndex]
  const ctaText = useLpcCtaText(currentCommand)
  const robotCommands = useAllCommandsQuery(basicRun.data?.id).data?.data
  const isComplete = currentCommandIndex === LPCMovementCommands.length - 1
  if (error != null) return { error }
  if (
    pendingCommandId != null &&
    Boolean(
      robotCommands?.find(
        command =>
          command.id === pendingCommandId && commandIsComplete(command.status)
      )
    )
  ) {
    setIsLoading(false)
    setPendingCommandId(null)
  }

  const proceed = (): void => {
    setIsLoading(true)

    // execute all load commands first if they haven't been executed yet
    if (!prepCommandsExecuted) {
      prepCommands.forEach((prepCommand: Command) => {
        createCommand(
          host as HostConfig,
          basicRun.data?.id as string,
          createCommandData(prepCommand)
        )
      })
      setPrepCommandsExecuted(true)
    }

    createCommand(
      host as HostConfig,
      basicRun.data?.id as string,
      createCommandData(currentCommand)
    )
      .then(response => {
        const commandId = response.data.data.id
        // execute the next movement command after issueing a savePosition command
        if (currentCommand.commandType === 'savePosition') {
          addSavePositionCommandId(commandId)
          const nextCommand = LPCMovementCommands[currentCommandIndex + 1]
          createCommand(
            host as HostConfig,
            basicRun.data?.id as string,
            createCommandData(nextCommand)
          )
            .then(response => {
              const commandId = response.data.data.id
              setPendingCommandId(commandId)
              // incremement currentCommandIndex by 2 since we've executed 2 commands
              setCurrentCommandIndex(currentCommandIndex + 2)
            })
            .catch((e: Error) => {
              console.error(`error issuing command to robot: ${e.message}`)
              setIsLoading(false)
              setError(e)
            })
        } else {
          setPendingCommandId(commandId)
          setCurrentCommandIndex(currentCommandIndex + 1)
        }
      })
      .catch((e: Error) => {
        console.error(`error issuing command to robot: ${e.message}`)
        setIsLoading(false)
        setError(e)
      })
  }

  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    const data = {
      commandType: 'moveRelative',
      data: {
        // @ts-expect-error TODO IMMEDIATELY: add pipette id to top level command object
        pipetteId: currentCommand.params.pipetteId,
        distance: step * dir,
        axis,
      },
    }

    createCommand(host as HostConfig, basicRun.data?.id as string, data).catch(
      (e: Error) => {
        setError(e)
        console.error(`error issuing jog command: ${e.message}`)
      }
    )
  }

  return {
    currentCommandIndex,
    isLoading,
    proceed,
    jog,
    ctaText,
    isComplete,
  }
}
