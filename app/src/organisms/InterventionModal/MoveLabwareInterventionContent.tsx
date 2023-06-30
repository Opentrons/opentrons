import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  Flex,
  ALIGN_CENTER,
  Icon,
  SPACING,
  COLORS,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  BORDERS,
  Box,
  MoveLabwareOnDeck,
  Module,
  LabwareRender,
} from '@opentrons/components'

import {
  getRunLabwareRenderInfo,
  getRunModuleRenderInfo,
  getLabwareNameFromRunData,
  getModuleModelFromRunData,
  getModuleDisplayLocationFromRunData,
} from './utils'
import { StyledText } from '../../atoms/text'
import { Divider } from '../../atoms/structure'

import {
  CompletedProtocolAnalysis,
  LabwareLocation,
  MoveLabwareRunTimeCommand,
  RobotType,
  getDeckDefFromRobotType,
  getLoadedLabwareDefinitionsByUri,
  getModuleDisplayName,
  getModuleType,
  getOccludedSlotCountForModule,
  getRobotTypeFromLoadedLabware,
} from '@opentrons/shared-data'
import type { RunData } from '@opentrons/api-client'
import { getLoadedLabware } from '../CommandText/utils/accessors'

export interface MoveLabwareInterventionProps {
  command: MoveLabwareRunTimeCommand
  analysis: CompletedProtocolAnalysis | null
  run: RunData
}

export function MoveLabwareInterventionContent({
  command,
  analysis,
  run,
}: MoveLabwareInterventionProps): JSX.Element | null {
  const { t } = useTranslation(['protocol_setup', 'protocol_command_text'])

  const analysisCommands = analysis?.commands ?? []
  const labwareDefsByUri = getLoadedLabwareDefinitionsByUri(analysisCommands)
  const robotType = getRobotTypeFromLoadedLabware(run.labware)
  const deckDef = getDeckDefFromRobotType(robotType)

  const moduleRenderInfo = getRunModuleRenderInfo(
    run,
    deckDef,
    labwareDefsByUri
  )
  const labwareRenderInfo = getRunLabwareRenderInfo(
    run,
    labwareDefsByUri,
    deckDef
  )
  const oldLabwareLocation =
    getLoadedLabware(run, command.params.labwareId)?.location ?? null

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
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap="0.75rem" width="100%">
      <MoveLabwareHeader />
      <Flex gridGap={SPACING.spacing32}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap="0.75rem" width="50%">
          <Flex
            flexDirection={DIRECTION_COLUMN}
            padding={SPACING.spacing4}
            backgroundColor={COLORS.fundamentalsBackground}
            borderRadius={BORDERS.radiusSoftCorners}
          >
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginBottom={SPACING.spacing2}
            >
              {t('labware_name')}
            </StyledText>
            <StyledText as="p">{labwareName}</StyledText>
            <Divider marginY={SPACING.spacing8} />
            <StyledText
              as="p"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
              marginBottom={SPACING.spacing2}
            >
              {t('labware_location')}
            </StyledText>
            <StyledText as="p">
              <span>
                <LabwareDisplayLocation
                  protocolData={run}
                  location={oldLabwareLocation}
                  robotType={robotType}
                />
                &rarr;
                <LabwareDisplayLocation
                  protocolData={run}
                  location={command.params.newLocation}
                  robotType={robotType}
                />
              </span>
            </StyledText>
          </Flex>
        </Flex>
        <Flex width="50%">
          <Box margin="0 auto" width="100%">
            <MoveLabwareOnDeck
              key={command.id} // important so that back to back move labware commands bust the cache
              robotType={robotType}
              initialLabwareLocation={oldLabwareLocation}
              finalLabwareLocation={command.params.newLocation}
              movedLabwareDef={movedLabwareDef}
              loadedModules={run.modules}
              backgroundItems={
                <>
                  {moduleRenderInfo.map(
                    ({ x, y, moduleId, moduleDef, nestedLabwareDef }) => (
                      <Module key={moduleId} def={moduleDef} x={x} y={y}>
                        {nestedLabwareDef != null ? (
                          <LabwareRender definition={nestedLabwareDef} />
                        ) : null}
                      </Module>
                    )
                  )}
                  {labwareRenderInfo
                    .filter(l => l.labwareId !== command.params.labwareId)
                    .map(({ x, y, labwareDef, labwareId }) => (
                      <g key={labwareId} transform={`translate(${x},${y})`}>
                        <LabwareRender definition={labwareDef} />
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

function MoveLabwareHeader(): JSX.Element {
  const { t } = useTranslation('run_details')
  return (
    <Flex alignItems={ALIGN_CENTER} gridGap="0.75rem">
      <Icon
        name="move-xy-circle"
        size={SPACING.spacing32}
        flex="0 0 auto"
        color={COLORS.successEnabled}
      />
      <StyledText as="h1">{t('move_labware')}</StyledText>
    </Flex>
  )
}

interface LabwareDisplayLocationProps {
  protocolData: RunData
  location: LabwareLocation
  robotType: RobotType
}
function LabwareDisplayLocation(
  props: LabwareDisplayLocationProps
): JSX.Element {
  const { t } = useTranslation('protocol_command_text')
  const { protocolData, location, robotType } = props
  let displayLocation = ''
  if (location === 'offDeck') {
    displayLocation = t('off_deck')
  } else if ('slotName' in location) {
    displayLocation = t('slot', { slot_name: location.slotName })
  } else if ('moduleId' in location) {
    const moduleModel = getModuleModelFromRunData(
      protocolData,
      location.moduleId
    )
    if (moduleModel == null) {
      console.warn('labware is located on an unknown module model')
    } else {
      displayLocation = t('module_in_slot', {
        count: getOccludedSlotCountForModule(
          getModuleType(moduleModel),
          robotType
        ),
        module: getModuleDisplayName(moduleModel),
        slot_name: getModuleDisplayLocationFromRunData(
          protocolData,
          location.moduleId
        ),
      })
    }
  } else {
    console.warn('display location could not be established: ', location)
  }
  return <>{displayLocation}</>
}
