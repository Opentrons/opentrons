import * as React from 'react'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
  parseInitialLoadedLabwareByAdapter,
} from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  BaseDeck,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  LabwareRender,
  Module,
  SlotLabels,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  inferModuleOrientationFromXCoordinate,
  THERMOCYCLER_MODULE_V1,
  getRobotTypeFromLoadedLabware,
} from '@opentrons/shared-data'

import { useAttachedModules } from '../../hooks'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import {
  getLabwareRenderInfo,
  getStandardDeckViewLayerBlockList,
  getProtocolModulesInfo,
} from '../utils'
import { getDeckConfigFromProtocolCommands } from '../../../../resources/deck_configuration/utils'
import { LiquidsLabwareDetailsModal } from './LiquidsLabwareDetailsModal'
import { getWellFillFromLabwareId } from './utils'
import { getAttachedProtocolModuleMatches } from '../../../ProtocolSetupModulesAndDeck/utils'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

const ATTACHED_MODULE_POLL_MS = 5000

interface SetupLiquidsMapProps {
  runId: string
  robotName: string
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
}

export function SetupLiquidsMap({
  runId,
  robotName,
  protocolAnalysis,
}: SetupLiquidsMapProps): JSX.Element | null {
  const [hoverLabwareId, setHoverLabwareId] = React.useState<string>('')

  const attachedModules =
    useAttachedModules({
      refetchInterval: ATTACHED_MODULE_POLL_MS,
    }) ?? []
  const [liquidDetailsLabwareId, setLiquidDetailsLabwareId] = React.useState<
    string | null
  >(null)

  if (protocolAnalysis == null) return null
  const robotType = getRobotTypeFromLoadedLabware(protocolAnalysis?.labware)

  const liquids = parseLiquidsInLoadOrder(
    protocolAnalysis.liquids != null ? protocolAnalysis.liquids : [],
    protocolAnalysis.commands
  )
  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    protocolAnalysis.commands
  )
  const deckDef = getDeckDefFromRobotType(robotType)
  const labwareByLiquidId = parseLabwareInfoByLiquidId(
    protocolAnalysis.commands
  )

  const deckConfig = getDeckConfigFromProtocolCommands(
    protocolAnalysis.commands
  )
  const labwareRenderInfo = getLabwareRenderInfo(protocolAnalysis, deckDef)
  const protocolModulesInfo = getProtocolModulesInfo(protocolAnalysis, deckDef)
  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo
  )
  const labwareLocations = map(
    labwareRenderInfo,
    ({ labwareDef, displayName, slotName }, labwareId) => {
      const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]
      const topLabwareDefinition =
        labwareInAdapter?.result?.definition ?? labwareDef
      const topLabwareId = labwareInAdapter?.result?.labwareId ?? labwareId
      const topLabwareDisplayName =
        labwareInAdapter?.params.displayName ?? displayName

      return {
        labwareLocation: { slotName },
        definition: topLabwareDefinition,
        topLabwareDisplayName,
        labwareChildren: (
          <LabwareInfoOverlay
            definition={topLabwareDefinition}
            labwareId={topLabwareId}
            displayName={topLabwareDisplayName}
            runId={runId}
          />
        ),
      }
    }
  )

  const moduleLocations = attachedProtocolModuleMatches.map(module => {
    const labwareInAdapterInMod =
      module.nestedLabwareId != null
        ? initialLoadedLabwareByAdapter[module.nestedLabwareId]
        : null
    const topLabwareDefinition =
      labwareInAdapterInMod?.result?.definition ?? module.nestedLabwareDef
    const topLabwareId =
      labwareInAdapterInMod?.result?.labwareId ?? module.nestedLabwareId
    const topLabwareDisplayName =
      labwareInAdapterInMod?.params.displayName ??
      module.nestedLabwareDisplayName

    return {
      moduleModel: module.moduleDef.model,
      moduleLocation: { slotName: module.slotName },
      innerProps:
        module.moduleDef.model === THERMOCYCLER_MODULE_V1
          ? { lidMotorState: 'open' }
          : {},
      nestedLabwareDef: topLabwareDefinition,
      moduleChildren: (
        <>
          {topLabwareDefinition != null && topLabwareId != null ? (
            <LabwareInfoOverlay
              definition={topLabwareDefinition}
              labwareId={topLabwareId}
              displayName={topLabwareDisplayName}
              runId={runId}
            />
          ) : null}
        </>
      ),
    }
  })

  return (
    <Flex
      maxHeight="80vh"
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <BaseDeck
        deckConfig={deckConfig}
        deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
        robotType={robotType}
        labwareLocations={labwareLocations}
        moduleLocations={moduleLocations}
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
                      onClick={() =>
                        labwareHasLiquid
                          ? setLiquidDetailsLabwareId(topLabwareId)
                          : null
                      }
                      cursor={labwareHasLiquid ? 'pointer' : ''}
                    >
                      <LabwareRender
                        definition={topLabwareDefinition}
                        wellFill={wellFill ?? undefined}
                        hover={
                          topLabwareId === hoverLabwareId && labwareHasLiquid
                        }
                      />
                      <LabwareInfoOverlay
                        definition={topLabwareDefinition}
                        labwareId={topLabwareId}
                        displayName={topLabwareDisplayName}
                        runId={runId}
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
            const topLabwareId =
              labwareInAdapter?.result?.labwareId ?? labwareId
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
                  onClick={() =>
                    labwareHasLiquid
                      ? setLiquidDetailsLabwareId(topLabwareId)
                      : null
                  }
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
                    runId={runId}
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
      {liquidDetailsLabwareId != null && (
        <LiquidsLabwareDetailsModal
          labwareId={liquidDetailsLabwareId}
          runId={runId}
          closeModal={() => setLiquidDetailsLabwareId(null)}
        />
      )}
    </Flex>
  )
}
