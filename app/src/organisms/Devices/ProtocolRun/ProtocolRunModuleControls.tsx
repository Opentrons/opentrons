import * as React from 'react'
import {
  Box,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_START,
  SPACING,
  WRAP,
} from '@opentrons/components'
import { ModuleCard } from '../../ModuleCard'
import {
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
} from '../hooks'
import { useCreateCommandMutation } from '@opentrons/react-api-client'

import type { LoadModuleRunTimeCommand } from '@opentrons/shared-data/protocol/types/schemaV6/command/setup'
import type { RunTimeCommand } from '@opentrons/shared-data'

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

  const loadCommands: LoadModuleRunTimeCommand[] =
    protocolData !== null
      ? protocolData?.commands.filter(
          (command: RunTimeCommand): command is LoadModuleRunTimeCommand =>
            command.commandType === 'loadModule'
        )
      : []

  React.useEffect(() => {
    if (protocolData != null) {
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
    }
  }, [])

  const halfAttachedModulesSize = Math.ceil(attachedModules?.length / 2)
  const firstHalfModules = attachedModules?.slice(0, halfAttachedModulesSize)
  const secondHalfModules = attachedModules?.slice(-halfAttachedModulesSize)
  console.log(firstHalfModules, secondHalfModules)
  return (
    <Flex
      gridGap={SPACING.spacing3}
      paddingTop={SPACING.spacing3}
      paddingX={SPACING.spacing2}
      flexDirection={DIRECTION_ROW}
      width="100%"
    >
      <Box flex="50%">
        {firstHalfModules.map((module, index) => (
          <Box
            key={`moduleCard_${module.moduleDef.moduleType}_${index}`}
            marginBottom={SPACING.spacing4}
          >
            {module.attachedModuleMatch != null ? (
              <ModuleCard
                robotName={robotName}
                runId={runId}
                module={module.attachedModuleMatch}
                slotName={module.slotName}
                isLoadedInRun={true}
              />
            ) : null}
          </Box>
        ))}
      </Box>
      <Box flex="50%">
        {secondHalfModules.map((module, index) => (
          <Box key={`moduleCard_${module.moduleDef.moduleType}_${index}`}>
            {module.attachedModuleMatch != null ? (
              <ModuleCard
                robotName={robotName}
                runId={runId}
                module={module.attachedModuleMatch}
                slotName={module.slotName}
                isLoadedInRun={true}
              />
            ) : null}
          </Box>
        ))}
      </Box>
    </Flex>
  )
}
