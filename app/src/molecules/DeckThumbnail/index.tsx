import * as React from 'react'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'

import {
  BaseDeck,
  LabwareRender,
  Module,
  SlotLabels,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  getRobotTypeFromLoadedLabware,
  THERMOCYCLER_MODULE_V1,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import {
  parseInitialLoadedLabwareByAdapter,
  parseLabwareInfoByLiquidId,
} from '@opentrons/api-client'

import { getStandardDeckViewLayerBlockList } from './utils/getStandardDeckViewLayerBlockList'
import { getDeckConfigFromProtocolCommands } from '../../resources/deck_configuration/utils'
import { getLabwareRenderInfo } from '../../organisms/Devices/ProtocolRun/utils/getLabwareRenderInfo'
import { getProtocolModulesInfo } from '../../organisms/Devices/ProtocolRun/utils/getProtocolModulesInfo'
import { useAttachedModules } from '../../organisms/Devices/hooks'
import { getAttachedProtocolModuleMatches } from '../../organisms/ProtocolSetupModulesAndDeck/utils'
import { LabwareInfoOverlay } from '../../organisms/Devices/ProtocolRun/LabwareInfoOverlay'
import { getWellFillFromLabwareId } from '../../organisms/Devices/ProtocolRun/SetupLiquids/utils'

import type { StyleProps } from '@opentrons/components'
import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

interface DeckThumbnailProps extends StyleProps {
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
}

export function DeckThumbnail(props: DeckThumbnailProps): JSX.Element | null {
  const { protocolAnalysis, ...styleProps } = props
  const attachedModules = useAttachedModules()
  const [hoverLabwareId, setHoverLabwareId] = React.useState<string>('')

  if (protocolAnalysis == null) return null

  const robotType = getRobotTypeFromLoadedLabware(protocolAnalysis.labware)
  const deckDef = getDeckDefFromRobotType(robotType)
  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    protocolAnalysis.commands
  )

  const deckConfig = getDeckConfigFromProtocolCommands(
    protocolAnalysis.commands
  )
  const liquids = protocolAnalysis.liquids

  const labwareRenderInfo =
    protocolAnalysis != null
      ? getLabwareRenderInfo(protocolAnalysis, deckDef)
      : {}
  const protocolModulesInfo =
    protocolAnalysis != null
      ? getProtocolModulesInfo(protocolAnalysis, deckDef)
      : []
  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo
  )
  const labwareByLiquidId = parseLabwareInfoByLiquidId(
    protocolAnalysis.commands
  )

  const moduleLocations = attachedProtocolModuleMatches.map(module => {
    const labwareInAdapterInMod =
      module.nestedLabwareId != null
        ? initialLoadedLabwareByAdapter[module.nestedLabwareId]
        : null
    //  only rendering the labware on top most layer so
    //  either the adapter or the labware are rendered but not both
    const topLabwareDefinition =
      labwareInAdapterInMod?.result?.definition ?? module.nestedLabwareDef
    return {
      moduleModel: module.moduleDef.model,
      moduleLocation: { slotName: module.slotName },
      innerProps:
        module.moduleDef.model === THERMOCYCLER_MODULE_V1
          ? { lidMotorState: 'open' }
          : {},
      nestedLabwareDef: topLabwareDefinition,
    }
  })

  const labwareLocations = map(
    labwareRenderInfo,
    ({ labwareDef, displayName, slotName }, labwareId) => {
      const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]
      //  only rendering the labware on top most layer so
      //  either the adapter or the labware are rendered but not both
      const topLabwareDefinition =
        labwareInAdapter?.result?.definition ?? labwareDef
      const topLabwareId = labwareInAdapter?.result?.labwareId ?? labwareId
      const topLabwareDisplayName =
        labwareInAdapter?.params.displayName ?? displayName

      return {
        labwareLocation: { slotName },
        definition: topLabwareDefinition,
        topLabwareId,
        topLabwareDisplayName,
      }
    }
  )

  return (
    <BaseDeck
      deckConfig={deckConfig}
      deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
      robotType={robotType}
      labwareLocations={labwareLocations}
      moduleLocations={moduleLocations}
      {...styleProps}
    >
      {map(
        protocolModulesInfo,
        ({
          x,
          y,
          moduleDef,
          nestedLabwareDef,
          nestedLabwareId,
          nestedLabwareDisplayName,
          moduleId,
        }) => {
          const labwareInAdapterInMod =
            nestedLabwareId != null
              ? initialLoadedLabwareByAdapter[nestedLabwareId]
              : null
          //  only rendering the labware on top most layer so
          //  either the adapter or the labware are rendered but not both
          const topLabwareDefinition =
            labwareInAdapterInMod?.result?.definition ?? nestedLabwareDef
          const topLabwareId =
            labwareInAdapterInMod?.result?.labwareId ?? nestedLabwareId
          const topLabwareDisplayName =
            labwareInAdapterInMod?.params.displayName ??
            nestedLabwareDisplayName

          const wellFill = getWellFillFromLabwareId(
            topLabwareId ?? '',
            liquids,
            labwareByLiquidId
          )
          const labwareHasLiquid = !isEmpty(wellFill)

          return (
            <Module
              key={`LabwareSetup_Module_${moduleId}_${x}${y}`}
              x={x}
              y={y}
              orientation={inferModuleOrientationFromXCoordinate(x)}
              def={moduleDef}
              innerProps={
                moduleDef.model === THERMOCYCLER_MODULE_V1
                  ? { lidMotorState: 'open' }
                  : {}
              }
            >
              {topLabwareDefinition != null &&
              topLabwareDisplayName != null &&
              topLabwareId != null ? (
                <React.Fragment
                  key={`LabwareSetup_Labware_${topLabwareId}_${x}${y}`}
                >
                  <g
                    transform="translate(0,0)"
                    onMouseEnter={() => setHoverLabwareId(topLabwareId)}
                    onMouseLeave={() => setHoverLabwareId('')}
                    cursor={labwareHasLiquid ? 'pointer' : ''}
                  >
                    <LabwareRender
                      definition={topLabwareDefinition}
                      wellFill={wellFill ?? undefined}
                      hover={
                        topLabwareId === hoverLabwareId && labwareHasLiquid
                      }
                    />
                    {/* ToDo (kk:11/1/2023) This component need runId to get
                    mostRecentAnalysis in useLabwareOffsetForLabware
                    I think we need to add protocolAnalysis for this.
                    I will follow up that in another PR. */}
                    <LabwareInfoOverlay
                      definition={topLabwareDefinition}
                      labwareId={topLabwareId}
                      displayName={topLabwareDisplayName}
                      runId={'dummy'}
                      hover={
                        topLabwareId === hoverLabwareId && labwareHasLiquid
                      }
                      labwareHasLiquid={labwareHasLiquid}
                    />
                  </g>
                </React.Fragment>
              ) : null}
            </Module>
          )
        }
      )}
      {map(
        labwareRenderInfo,
        ({ x, y, labwareDef, displayName }, labwareId) => {
          const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]
          //  only rendering the labware on top most layer so
          //  either the adapter or the labware are rendered but not both
          const topLabwareDefinition =
            labwareInAdapter?.result?.definition ?? labwareDef
          const topLabwareId = labwareInAdapter?.result?.labwareId ?? labwareId
          const topLabwareDisplayName =
            labwareInAdapter?.params.displayName ?? displayName
          const wellFill = getWellFillFromLabwareId(
            topLabwareId ?? '',
            liquids,
            labwareByLiquidId
          )
          const labwareHasLiquid = !isEmpty(wellFill)
          return (
            <React.Fragment
              key={`LabwareSetup_Labware_${topLabwareId}_${x}${y}`}
            >
              <g
                transform={`translate(${x},${y})`}
                onMouseEnter={() => setHoverLabwareId(topLabwareId)}
                onMouseLeave={() => setHoverLabwareId('')}
                cursor={labwareHasLiquid ? 'pointer' : ''}
              >
                <LabwareRender
                  definition={topLabwareDefinition}
                  wellFill={labwareHasLiquid ? wellFill : undefined}
                  hover={labwareId === hoverLabwareId && labwareHasLiquid}
                />
                <LabwareInfoOverlay
                  definition={topLabwareDefinition}
                  labwareId={topLabwareId}
                  displayName={topLabwareDisplayName}
                  runId={''}
                  hover={labwareId === hoverLabwareId && labwareHasLiquid}
                  labwareHasLiquid={labwareHasLiquid}
                />
              </g>
            </React.Fragment>
          )
        }
      )}
      <SlotLabels robotType={robotType} />
    </BaseDeck>
  )
}
