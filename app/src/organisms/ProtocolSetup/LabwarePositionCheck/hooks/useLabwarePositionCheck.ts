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
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5'
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
  switch (command.command) {
    case 'moveToWell': {
      const labwareId = command.params.labware
      const slot = protocolData?.labware[labwareId].slot
      return `Confirm position, move to slot ${slot}`
    }
    case 'thermocycler/openLid': {
      const moduleId = command.params.module
      const slot = protocolData?.modules[moduleId].slot
      return `Confirm position, move to slot ${slot}`
    }
    case 'pickUpTip': {
      return `Confirm position, pick up tip`
    }
    case 'dropTip': {
      const labwareId = command.params.labware
      const slot = protocolData?.labware[labwareId].slot
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
  commandType: command.command,
  data: command.params,
})

export function useLabwarePositionCheck(
  addSavePositionCommandId: (commandId: string) => void
): LabwarePositionCheckUtils {
  const [currentCommandIndex, setCurrentCommandIndex] = React.useState<number>(
    0
  )
  const [pendingCommandId, setPendingCommandId] = React.useState<string | null>(
    null
  )
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<Error | null>(null)
  const host = useHost()
  const basicRun = useEnsureBasicRun()
  if (basicRun.error != null && error !== null) {
    setError(basicRun.error)
  }
  const LPCCommands = useSteps().reduce<Command[]>((steps, currentStep) => {
    return [...steps, ...currentStep.commands]
  }, [])
  const currentCommand = LPCCommands[currentCommandIndex]
  const ctaText = useLpcCtaText(currentCommand)
  const robotCommands = useAllCommandsQuery(basicRun.data?.id).data?.data
  const isComplete = currentCommandIndex === LPCCommands.length - 1
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

    createCommand(
      host as HostConfig,
      basicRun.data?.id as string,
      createCommandData(currentCommand)
    )
      .then(response => {
        const commandId = response.data.data.id
        // @ts-expect-error delete this when schema v6 types are out
        if (currentCommand.command === 'savePosition') {
          addSavePositionCommandId(commandId)
        }

        // execute the next moveToWell command if opening TC lid
        if (currentCommand.command === 'thermocycler/openLid') {
          const nextCommand = LPCCommands[currentCommandIndex + 1]
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
        }
        setPendingCommandId(commandId)
        console.log('incrementing command index')
        setCurrentCommandIndex(currentCommandIndex + 1)
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
