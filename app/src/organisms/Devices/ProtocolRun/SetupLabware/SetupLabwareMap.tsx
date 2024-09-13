import * as React from 'react'
import map from 'lodash/map'

import {
  BaseDeck,
  Flex,
  Box,
  DIRECTION_COLUMN,
  SPACING,
} from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  getDeckDefFromRobotType,
  getSimplestDeckConfigForProtocol,
  parseInitialLoadedLabwareByAdapter,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { getLabwareSetupItemGroups } from '../../../../pages/Protocols/utils'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { getLabwareRenderInfo } from '../utils/getLabwareRenderInfo'
import { getProtocolModulesInfo } from '../utils/getProtocolModulesInfo'
import { getStandardDeckViewLayerBlockList } from '../utils/getStandardDeckViewLayerBlockList'
import { OffDeckLabwareList } from './OffDeckLabwareList'

import type {
  CompletedProtocolAnalysis,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'
import { LabwareStackModal } from './LabwareStackModal'

interface SetupLabwareMapProps {
  runId: string
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
}

export function SetupLabwareMap({
  runId,
  protocolAnalysis,
}: SetupLabwareMapProps): JSX.Element | null {
  // early return null if no protocol analysis
  const [
    labwareStackDetailsLabwareId,
    setLabwareStackDetailsLabwareId,
  ] = React.useState<string | null>(null)
  const [hoverLabwareId, setHoverLabwareId] = React.useState<string | null>(
    null
  )

  if (protocolAnalysis == null) return null

  const commands = protocolAnalysis.commands

  const robotType = protocolAnalysis.robotType ?? FLEX_ROBOT_TYPE
  const deckDef = getDeckDefFromRobotType(robotType)

  const protocolModulesInfo = getProtocolModulesInfo(protocolAnalysis, deckDef)

  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    commands
  )

  const modulesOnDeck = protocolModulesInfo.map(module => {
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
      highlightLabware:
        topLabwareDefinition != null &&
        topLabwareId != null &&
        hoverLabwareId === topLabwareId,
      highlightShadowLabware:
        topLabwareDefinition != null &&
        topLabwareId != null &&
        hoverLabwareId === topLabwareId,
      stacked: topLabwareDefinition != null && topLabwareId != null,
      moduleChildren: (
        // open modal
        <g
          onClick={() => {
            if (topLabwareDefinition != null && topLabwareId != null) {
              setLabwareStackDetailsLabwareId(topLabwareId)
            }
          }}
          onMouseEnter={() => {
            if (topLabwareDefinition != null && topLabwareId != null) {
              setHoverLabwareId(topLabwareId)
            }
          }}
          onMouseLeave={() => {
            setHoverLabwareId(null)
          }}
          cursor="pointer"
        >
          {topLabwareDefinition != null && topLabwareId != null ? (
            <LabwareInfoOverlay
              definition={topLabwareDefinition}
              labwareId={topLabwareId}
              displayName={topLabwareDisplayName}
              runId={runId}
            />
          ) : null}
        </g>
      ),
    }
  })

  const { offDeckItems } = getLabwareSetupItemGroups(commands)

  const deckConfig = getSimplestDeckConfigForProtocol(protocolAnalysis)

  const labwareRenderInfo = getLabwareRenderInfo(protocolAnalysis, deckDef)

  const labwareOnDeck = map(
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
      const isLabwareInStack =
        topLabwareDefinition != null &&
        topLabwareId != null &&
        labwareInAdapter != null

      return {
        labwareLocation: { slotName },
        definition: topLabwareDefinition,
        topLabwareId,
        topLabwareDisplayName,
        highlight: isLabwareInStack && hoverLabwareId === topLabwareId,
        highlightShadow: isLabwareInStack && hoverLabwareId === topLabwareId,
        labwareChildren: (
          <g
            cursor={isLabwareInStack ? 'pointer' : ''}
            onClick={() => {
              if (isLabwareInStack) {
                setLabwareStackDetailsLabwareId(topLabwareId)
              }
            }}
            onMouseEnter={() => {
              if (topLabwareDefinition != null && topLabwareId != null) {
                setHoverLabwareId(() => topLabwareId)
              }
            }}
            onMouseLeave={() => {
              setHoverLabwareId(null)
            }}
          >
            <LabwareInfoOverlay
              definition={topLabwareDefinition}
              labwareId={topLabwareId}
              displayName={topLabwareDisplayName}
              runId={runId}
            />
          </g>
        ),
        stacked: isLabwareInStack,
      }
    }
  )

  return (
    <Flex flex="1" maxHeight="180vh" flexDirection={DIRECTION_COLUMN}>
      <Flex flexDirection={DIRECTION_COLUMN} marginY={SPACING.spacing16}>
        <Box margin="0 auto" maxWidth="46.25rem" width="100%">
          <BaseDeck
            deckConfig={deckConfig}
            deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
            robotType={robotType}
            labwareOnDeck={labwareOnDeck}
            modulesOnDeck={modulesOnDeck}
          />
        </Box>
        <OffDeckLabwareList
          labwareItems={offDeckItems}
          isFlex={robotType === FLEX_ROBOT_TYPE}
          commands={commands}
        />
      </Flex>
      {labwareStackDetailsLabwareId != null && (
        <LabwareStackModal
          labwareIdTop={labwareStackDetailsLabwareId}
          commands={commands}
          closeModal={() => {
            setLabwareStackDetailsLabwareId(null)
          }}
          robotType={robotType}
        />
      )}
    </Flex>
  )
}
