import * as React from 'react'
import {
  createCommand,
  HostConfig,
  SessionCommandSummary,
} from '@opentrons/api-client'
import {
  useHost,
  useEnsureBasicSession,
  useAllCommandsQuery,
} from '@opentrons/react-api-client'
import { useSteps } from '.'
import type { Command } from '@opentrons/shared-data/protocol/types/schemaV5'
import type {
  Axis,
  Jog,
  Sign,
  StepSize,
} from '../../../../molecules/JogControls/types'
import { createCommand } from '../../../../../../api-client/src/sessions'

interface LabwarePositionCheckUtils {
  currentCommandIndex: number
  isLoading: boolean
  proceed: () => void
  jog: Jog
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
  proceedToSummary: () => unknown,
  addSavePositionCommandId: (commandId: string) => void
): LabwarePositionCheckUtils | null {
  const [currentCommandIndex, setCurrentCommandIndex] = React.useState<number>(
    0
  )
  const [pendingCommandId, setPendingCommandId] = React.useState<string | null>(
    null
  )
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const host = useHost()
  const basicSession = useEnsureBasicSession()
  const LPCCommands = useSteps().reduce<Command[]>((steps, currentStep) => {
    return [...steps, ...currentStep.commands]
  }, [])
  const currentRunCommands = useAllCommandsQuery(basicSession?.id).data?.data
  if (basicSession == null) return null
  if (
    pendingCommandId != null &&
    Boolean(
      currentRunCommands?.find(
        command =>
          command.id === pendingCommandId && commandIsComplete(command.status)
      )
    )
  ) {
    setIsLoading(false)
    setPendingCommandId(null)
  }

  const currentCommand = LPCCommands[currentCommandIndex]

  const proceed = (): void => {
    setIsLoading(true)
    const data = createCommandData(currentCommand)

    createCommand(host as HostConfig, basicSession.id, data)
      .then(response => {
        const commandId = response.data.data.id
        // @ts-expect-error delete this when schema v6 types are out
        if (currentCommand.command === 'savePosition') {
          addSavePositionCommandId(commandId)
        }

        // execute the next moveToWell command if opening TC lid
        if (currentCommand.command === 'thermocycler/openLid') {
          const nextCommand = LPCCommands[currentCommandIndex + 1]
          const nextData = createCommandData(nextCommand)
          createCommand(host as HostConfig, basicSession.id, nextData)
            .then(response => {
              const commandId = response.data.data.id
              setPendingCommandId(commandId)
              // incremement currentCommandIndex by 2 since we're executing 2 commands
              setCurrentCommandIndex(currentCommandIndex + 2)
            })
            .catch(e => {
              console.error(`error issuing command to robot: ${e}`)
              setIsLoading(false)
            })
        } else {
          setPendingCommandId(commandId)
          setCurrentCommandIndex(currentCommandIndex + 1)
        }
      })
      .catch(e => {
        console.error(`error issuing command to robot: ${e}`)
        setIsLoading(false)
      })
  }

  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    const data = {
      commandType: 'moveRelative',
      data: {
        // @ts-expect-error TODO IMMEDIATELY: add pipette id to top level command object
        pipetteId: currentCommand.params.pipetteId,
        distance: step,
        axis,
      },
    }

    createCommand(host as HostConfig, basicSession.id, data).catch(e =>
      console.error(`error issuing jog command: ${e}`)
    )
  }

  return {
    currentCommandIndex,
    isLoading,
    proceed,
    jog,
  }
}
