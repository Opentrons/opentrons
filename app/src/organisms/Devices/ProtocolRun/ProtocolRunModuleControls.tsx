import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_START,
  SPACING,
  WRAP,
} from '@opentrons/components'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import { LoadModuleRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import * as React from 'react'
import { useCurrentRunId } from '../../ProtocolUpload/hooks'
import {
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
} from '../hooks'
import { ModuleCard } from '../ModuleCard'

interface ProtocolRunModuleControlsProps {
  robotName: string
  runId: string
}

export const ProtocolRunModuleControls = ({
  robotName,
  runId,
}: ProtocolRunModuleControlsProps): JSX.Element | null => {
  const moduleRenderInfoForProtocolById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const attachedModules = Object.values(moduleRenderInfoForProtocolById).filter(
    module => module.attachedModuleMatch != null
  )

  const { protocolData } = useProtocolDetailsForRun(runId)
  const { createCommand } = useCreateCommandMutation()

  const loadCommands: LoadModuleRunTimeCommand[] = protocolData?.commands.filter(
    command => command.commandType === 'loadModule'
  )

  const setupLoadCommands = loadCommands.map(command => {
    const commandWithModuleId = {
      ...command,
      params: {
        ...command.params,
        moduleId: command.result?.moduleId,
      },
    }
    return commandWithModuleId
  })

  setupLoadCommands.forEach(loadCommand => {
    createCommand({
      runId: runId,
      command: loadCommand,
    }).catch((e: Error) => {
      console.error(`error issuing command to robot: ${e.message}`)
    })
  })

  // const sendLoadCommand = (): void => {
  //   createCommand({ runId: runId, command: setShakeCommand }).catch(
  //     (e: Error) => {
  //       console.error(
  //         `error setting heater shaker shake speed: ${e.message} with run id ${runId}`
  //       )
  //     }
  //   )
  // }

  // createCommand({
  //   runId: currentRunId,
  //   command: createCommandData(prepCommand),
  // }).catch((e: Error) => {
  //   console.error(`error issuing command to robot: ${e.message}`)
  //   setError(e)
  // })

  return (
    <Flex
      width={attachedModules.length === 1 ? '100%' : '50%'}
      justifyContent={JUSTIFY_START}
      flexWrap={WRAP}
      flexDirection={DIRECTION_COLUMN}
      maxHeight="25rem"
    >
      {attachedModules.map((module, index) => {
        return (
          <Flex
            marginTop={SPACING.spacing3}
            key={`moduleCard_${module.moduleDef.moduleType}_${index}`}
          >
            {module.attachedModuleMatch != null ? (
              <ModuleCard
                robotName={robotName}
                runId={runId}
                module={module.attachedModuleMatch}
                slotName={module.slotName}
              />
            ) : null}
          </Flex>
        )
      })}
    </Flex>
  )
}
