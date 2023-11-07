import * as React from 'react'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import {
  parseInitialLoadedLabwareByAdapter,
  parseLabwareInfoByLiquidId,
  parseLiquidsInLoadOrder,
} from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  BaseDeck,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  LabwareRender,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  getRobotTypeFromLoadedLabware,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { useAttachedModules } from '../../hooks'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { LiquidsLabwareDetailsModal } from './LiquidsLabwareDetailsModal'
import { getWellFillFromLabwareId } from './utils'
import { getLabwareRenderInfo } from '../utils/getLabwareRenderInfo'
import { getDeckConfigFromProtocolCommands } from '../../../../resources/deck_configuration/utils'
import { getStandardDeckViewLayerBlockList } from '../utils/getStandardDeckViewLayerBlockList'
import { getAttachedProtocolModuleMatches } from '../../../ProtocolSetupModulesAndDeck/utils'
import { getProtocolModulesInfo } from '../utils/getProtocolModulesInfo'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

const ATTACHED_MODULE_POLL_MS = 5000

interface SetupLiquidsMapProps {
  runId: string
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
}

export function SetupLiquidsMap(
  props: SetupLiquidsMapProps
): JSX.Element | null {
  const { runId, protocolAnalysis } = props
  const [hoverLabwareId, setHoverLabwareId] = React.useState<string>('')
  const [liquidDetailsLabwareId, setLiquidDetailsLabwareId] = React.useState<
    string | null
  >(null)
  const attachedModules =
    useAttachedModules({
      refetchInterval: ATTACHED_MODULE_POLL_MS,
    }) ?? []

  if (protocolAnalysis == null) return null

  const liquids = parseLiquidsInLoadOrder(
    protocolAnalysis.liquids != null ? protocolAnalysis.liquids : [],
    protocolAnalysis.commands ?? []
  )
  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    protocolAnalysis.commands ?? []
  )
  const robotType = getRobotTypeFromLoadedLabware(protocolAnalysis.labware)
  const deckDef = getDeckDefFromRobotType(robotType)
  const labwareRenderInfo = getLabwareRenderInfo(protocolAnalysis, deckDef)
  const labwareByLiquidId = parseLabwareInfoByLiquidId(
    protocolAnalysis.commands ?? []
  )
  const deckConfig = getDeckConfigFromProtocolCommands(
    protocolAnalysis.commands
  )
  const deckLayerBlocklist = getStandardDeckViewLayerBlockList(robotType)

  const protocolModulesInfo = getProtocolModulesInfo(protocolAnalysis, deckDef)

  const attachedProtocolModuleMatches = getAttachedProtocolModuleMatches(
    attachedModules,
    protocolModulesInfo
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
        deckLayerBlocklist={deckLayerBlocklist}
        robotType={robotType}
        labwareLocations={[]}
        moduleLocations={moduleLocations}
      >
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
