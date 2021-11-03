import * as React from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  HostConfig,
  createCommand,
  RunCommandSummary,
} from '@opentrons/api-client'
import {
  useHost,
  useEnsureBasicRun,
  useAllCommandsQuery,
} from '@opentrons/react-api-client'
import { useProtocolDetails } from '../../../RunDetails/hooks'
import { getLabwareLocation } from '../../utils/getLabwareLocation'
import { getModuleLocation } from '../../utils/getModuleLocation'
import { useCommands } from '.'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV6'
import type { SetupCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type {
  Axis,
  Jog,
  Sign,
  StepSize,
} from '../../../../molecules/JogControls/types'
import type {
  LabwarePositionCheckCommand,
  LabwarePositionCheckMovementCommand,
} from '../types'

type LabwarePositionCheckUtils =
  | {
      currentCommandIndex: number
      isLoading: boolean
      isComplete: boolean
      beginLPC: () => void
      proceed: () => void
      jog: Jog
      ctaText: string
    }
  | { error: Error }

const useLpcCtaText = (command: LabwarePositionCheckCommand): string => {
  const { protocolData } = useProtocolDetails()
  const commands = protocolData?.commands ?? []
  switch (command.commandType) {
    case 'dropTip':
    case 'moveToWell': {
      const labwareId = command.params.labwareId
      const slot = getLabwareLocation(labwareId, commands)
      return `Confirm position, move to slot ${slot}`
    }
    case 'thermocycler/openLid': {
      const moduleId = command.params.moduleId
      const slot = getModuleLocation(moduleId, commands)
      return `Confirm position, move to slot ${slot}`
    }
    case 'pickUpTip': {
      return `Confirm position, pick up tip`
    }
  }
}

const commandIsComplete = (status: RunCommandSummary['status']): boolean =>
  status === 'succeeded' || status === 'failed'

const createCommandData = (
  command: Command | LabwarePositionCheckCommand
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
  addSavePositionCommandData: (commandId: string, labwareId: string) => void
): LabwarePositionCheckUtils {
  const [currentCommandIndex, setCurrentCommandIndex] = React.useState<number>(
    0
  )
  const [
    pendingMovementCommandData,
    setPendingMovementCommandData,
  ] = React.useState<{
    commandId: string
    pipetteId: string
    labwareId: string
  } | null>(null)
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<Error | null>(null)
  const { protocolData } = useProtocolDetails()
  const host = useHost()
  const basicRun = useEnsureBasicRun()
  if (basicRun.error != null && error !== null) {
    setError(basicRun.error)
  }
  const loadCommands = protocolData?.commands.filter(isLoadCommand) ?? []
  const TCOpenCommands = useCommands().filter(isTCOpenCommand) ?? []
  // prepCommands will be run when a user starts LPC
  const prepCommands = [...loadCommands, ...TCOpenCommands]
  // LPCMovementCommands will be run during the guided LPC flow
  const LPCMovementCommands: LabwarePositionCheckMovementCommand[] = useCommands().filter(
    (
      command: LabwarePositionCheckCommand
    ): command is LabwarePositionCheckMovementCommand =>
      command.commandType !== 'thermocycler/openLid'
  )
  const lastCommand = LPCMovementCommands[currentCommandIndex - 1]
  const currentCommand = LPCMovementCommands[currentCommandIndex]
  const ctaText = useLpcCtaText(currentCommand)
  const robotCommands = useAllCommandsQuery(basicRun.data?.id).data?.data
  const isComplete = currentCommandIndex === LPCMovementCommands.length
  if (error != null) return { error }
  const completedMovementCommand =
    pendingMovementCommandData != null &&
    robotCommands?.find(
      (command: RunCommandSummary) =>
        command.id === pendingMovementCommandData.commandId &&
        command.status != null &&
        commandIsComplete(command.status)
    )
  if (completedMovementCommand && pendingMovementCommandData) {
    // bail if the command failed
    if (completedMovementCommand.status === 'failed') {
      setError(
        new Error(
          `movement command id ${completedMovementCommand.id} failed on the robot`
        )
      )
    } else {
      // the movement command is complete, save its position for use later
      const savePositionCommand: Command = {
        commandType: 'savePosition',
        id: uuidv4(),
        params: { pipetteId: pendingMovementCommandData.pipetteId },
      }
      createCommand(
        host as HostConfig,
        basicRun.data?.id as string,
        createCommandData(savePositionCommand)
      )
        .then(response => {
          const commandId = response.data.data.id
          addSavePositionCommandData(
            commandId,
            pendingMovementCommandData.labwareId
          )
        })
        .catch((e: Error) => {
          console.error(`error issuing command to robot: ${e.message}`)
          setIsLoading(false)
          setError(e)
        })
      setIsLoading(false)
      setPendingMovementCommandData(null)
    }
  }

  const proceed = (): void => {
    setIsLoading(true)
    // before executing the next movement command, save the current position
    const savePositionCommand: Command = {
      commandType: 'savePosition',
      id: uuidv4(),
      params: { pipetteId: lastCommand.params.pipetteId },
    }
    createCommand(
      host as HostConfig,
      basicRun.data?.id as string,
      createCommandData(savePositionCommand)
    )
      // add the saved command id so we can use it to query locations later
      .then(response => {
        const commandId = response.data.data.id
        addSavePositionCommandData(commandId, lastCommand.params.labwareId)
        // execute the movement command
        return createCommand(
          host as HostConfig,
          basicRun.data?.id as string,
          createCommandData(currentCommand)
        )
      })
      .then(response => {
        const commandId = response.data.data.id
        const pipetteId = currentCommand.params.pipetteId
        const labwareId: string = currentCommand.params.labwareId
        setPendingMovementCommandData({ commandId, pipetteId, labwareId })
        setCurrentCommandIndex(currentCommandIndex + 1)
      })
      .catch((e: Error) => {
        console.error(`error issuing command to robot: ${e.message}`)
        setError(e)
      })
  }

  const beginLPC = (): void => {
    setIsLoading(true)
    // execute prep commands
    prepCommands.forEach((prepCommand: Command) => {
      createCommand(
        host as HostConfig,
        basicRun.data?.id as string,
        createCommandData(prepCommand)
      ).catch((e: Error) => {
        console.error(`error issuing command to robot: ${e.message}`)
        setError(e)
      })
    })
    // issue first movement command
    createCommand(
      host as HostConfig,
      basicRun.data?.id as string,
      createCommandData(currentCommand)
    )
      .then(response => {
        const commandId = response.data.data.id
        setPendingMovementCommandData({
          commandId,
          labwareId: currentCommand.params.labwareId,
          pipetteId: currentCommand.params.pipetteId,
        })
        setCurrentCommandIndex(currentCommandIndex + 1)
      })
      .catch((e: Error) => {
        console.error(`error issuing command to robot: ${e.message}`)
        setError(e)
      })
  }

  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    const data = {
      commandType: 'moveRelative',
      data: {
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
    beginLPC,
    proceed,
    jog,
    ctaText,
    isComplete,
  }
}
