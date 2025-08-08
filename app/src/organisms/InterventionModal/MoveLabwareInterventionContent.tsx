import { useTranslation } from 'react-i18next'

import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  getLabwareDisplayLocation,
  getLoadedLabware,
  MoveLabwareOnDeck,
  SPACING,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  getLoadedLabwareDefinitionsByUri,
} from '@opentrons/shared-data'

import { InterventionInfo } from '/app/molecules/InterventionModal/InterventionContent'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import { getRunCurrentLabwareInfo } from '../ErrorRecoveryFlows/hooks/useDeckMapUtils'
import { getLabwareNameFromRunData, getRunModuleRenderInfo } from './utils'

import type { RunData } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  MoveLabwareRunTimeCommand,
  RobotType,
} from '@opentrons/shared-data'

export interface MoveLabwareInterventionProps {
  command: MoveLabwareRunTimeCommand
  analysis: CompletedProtocolAnalysis | null
  run: RunData
  robotType: RobotType
  isOnDevice: boolean
}

export function MoveLabwareInterventionContent({
  command,
  analysis,
  run,
  robotType,
  isOnDevice,
}: MoveLabwareInterventionProps): JSX.Element | null {
  const { t, i18n } = useTranslation('protocol_command_text')

  const analysisCommands = analysis?.commands ?? []
  const labwareDefsByUri = getLoadedLabwareDefinitionsByUri(analysisCommands)
  const deckDef = getDeckDefFromRobotType(robotType)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const runCurrentLabwareInfo = getRunCurrentLabwareInfo({
    runData: run,
    runLwDefsByUri: labwareDefsByUri,
  })

  const labwareOnDeck = runCurrentLabwareInfo
    .filter(lw => lw.labwareId !== command.params.labwareId)
    .map(lw => ({
      labwareLocation: lw.labwareLocation,
      definition: lw.labwareDef,
      labwareId: lw.labwareId,
    }))

  const moduleRenderInfo = getRunModuleRenderInfo(
    run,
    deckDef,
    labwareDefsByUri
  )
  const modulesOnDeck = moduleRenderInfo?.map(module => {
    return {
      moduleModel: module.moduleDef.model,
      moduleLocation: { slotName: module.targetSlotId },
      nestedLabwareDef:
        module.nestedLabwareId !== command.params.labwareId
          ? module.nestedLabwareDef
          : null,
    }
  })

  const oldLabwareLocation =
    getLoadedLabware(run.labware, command.params.labwareId)?.location ?? null

  const labwareName = getLabwareNameFromRunData(
    run,
    command.params.labwareId,
    analysisCommands
  )
  const movedLabwareDefUri = run.labware.find(
    l => l.id === command.params.labwareId
  )?.definitionUri
  const movedLabwareDef =
    movedLabwareDefUri != null
      ? labwareDefsByUri?.[movedLabwareDefUri] ?? null
      : null
  if (oldLabwareLocation == null || movedLabwareDef == null) return null
  const oldDisplayLabwareLocation = getLabwareDisplayLocation({
    location: oldLabwareLocation,
    loadedModules: run.modules,
    loadedLabwares: run.labware,
    robotType: 'OT-3 Standard',
    detailLevel: 'slot-only',
    t,
  })
  const newDisplayLabwareLocation = getLabwareDisplayLocation({
    location: command.params.newLocation,
    loadedModules: run.modules,
    loadedLabwares: run.labware,
    robotType: 'OT-3 Standard',
    detailLevel: 'slot-only',
    t,
  })
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      width="100%"
    >
      <Flex gridGap={SPACING.spacing32}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing12}
          width="50%"
        >
          <InterventionInfo
            layout="default"
            type="location-arrow-location"
            labwareName={labwareName}
            currentLocationProps={{
              deckLabel: i18n.format(oldDisplayLabwareLocation, 'upperCase'),
            }}
            newLocationProps={{
              deckLabel: i18n.format(newDisplayLabwareLocation, 'upperCase'),
            }}
          />
        </Flex>
        <Flex width="50%">
          <Box margin="0 auto" width="100%">
            <MoveLabwareOnDeck
              robotType={robotType}
              deckFill={isOnDevice ? COLORS.grey35 : '#e6e6e6'}
              initialLabwareLocation={oldLabwareLocation}
              finalLabwareLocation={command.params.newLocation}
              movedLabwareDef={movedLabwareDef}
              labwareDefinitions={Object.values(labwareDefsByUri)}
              loadedModules={run.modules}
              loadedLabware={run.labware}
              deckConfig={deckConfig}
              modulesOnDeck={modulesOnDeck}
              labwareOnDeck={labwareOnDeck}
            />
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}
