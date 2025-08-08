import { useTranslation } from 'react-i18next'

import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  getLabwareDisplayLocation,
  getLoadedLabware,
  LabwareRender,
  MoveLabwareOnDeck,
  SPACING,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  getLoadedLabwareDefinitionsByUri,
} from '@opentrons/shared-data'

import { InterventionInfo } from '/app/molecules/InterventionModal/InterventionContent'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'

import {
  getLabwareNameFromRunData,
  getRunLabwareRenderInfo,
  getRunModuleRenderInfo,
} from './utils'

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
  const { t } = useTranslation('protocol_command_text')

  const analysisCommands = analysis?.commands ?? []
  const labwareDefsByUri = getLoadedLabwareDefinitionsByUri(analysisCommands)
  const deckDef = getDeckDefFromRobotType(robotType)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  const labwareRenderInfo = getRunLabwareRenderInfo(
    run,
    labwareDefsByUri,
    deckDef
  )
  const moduleRenderInfo = getRunModuleRenderInfo(
    run,
    deckDef,
    labwareDefsByUri
  )
  const modulesOnDeck = moduleRenderInfo
    ?.filter(module => module.targetSlotId != null)
    .map(module => {
      return {
        moduleModel: module.moduleDef.model,
        moduleLocation: { slotName: module.targetSlotId ?? '' },
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
    includeSlotText: false,
    t,
  })
  const newDisplayLabwareLocation = getLabwareDisplayLocation({
    location: command.params.newLocation,
    loadedModules: run.modules,
    loadedLabwares: run.labware,
    robotType: 'OT-3 Standard',
    detailLevel: 'slot-only',
    includeSlotText: false,
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
              deckLabel: oldDisplayLabwareLocation,
            }}
            newLocationProps={{
              deckLabel: newDisplayLabwareLocation,
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
              backgroundItems={
                <>
                  {labwareRenderInfo
                    .filter(l => l.labwareId !== command.params.labwareId)
                    .map(({ labwareOrigin, labwareDef, labwareId }) => (
                      <g
                        key={labwareId}
                        transform={`translate(${labwareOrigin.x},${labwareOrigin.y})`}
                      >
                        <LabwareRender
                          definition={labwareDef}
                          positioningMode="passThrough"
                        />
                      </g>
                    ))}
                </>
              }
            />
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}
