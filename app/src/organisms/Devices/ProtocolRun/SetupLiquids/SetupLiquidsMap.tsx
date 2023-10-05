import * as React from 'react'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
  parseInitialLoadedLabwareByAdapter,
} from '@opentrons/api-client'
import {
  DIRECTION_COLUMN,
  Flex,
  RobotWorkSpace,
  SlotLabels,
  LabwareRender,
  Module,
  ALIGN_CENTER,
  JUSTIFY_CENTER,
} from '@opentrons/components'
import {
  getDeckDefFromRobotType,
  inferModuleOrientationFromXCoordinate,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import {
  useLabwareRenderInfoForRunById,
  useModuleRenderInfoForProtocolById,
  useProtocolDetailsForRun,
} from '../../hooks'
import { useMostRecentCompletedAnalysis } from '../../../LabwarePositionCheck/useMostRecentCompletedAnalysis'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import { getStandardDeckViewLayerBlockList } from '../utils/getStandardDeckViewLayerBlockList'
import { LiquidsLabwareDetailsModal } from './LiquidsLabwareDetailsModal'
import { getWellFillFromLabwareId } from './utils'
import type { RobotType } from '@opentrons/shared-data'

const OT2_VIEWBOX = '-80 -40 550 500'
const OT3_VIEWBOX = '-144.31 -76.59 750 681.74'

const getViewBox = (robotType: RobotType): string | null => {
  switch (robotType) {
    case 'OT-2 Standard':
      return OT2_VIEWBOX
    case 'OT-3 Standard':
      return OT3_VIEWBOX
    default:
      return null
  }
}
interface SetupLiquidsMapProps {
  runId: string
  robotName: string
}

export function SetupLiquidsMap(props: SetupLiquidsMapProps): JSX.Element {
  const { runId, robotName } = props
  const [hoverLabwareId, setHoverLabwareId] = React.useState<string>('')

  const moduleRenderInfoById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const labwareRenderInfoById = useLabwareRenderInfoForRunById(runId)
  const { robotType } = useProtocolDetailsForRun(runId)
  const protocolData = useMostRecentCompletedAnalysis(runId)
  const liquids = parseLiquidsInLoadOrder(
    protocolData?.liquids != null ? protocolData?.liquids : [],
    protocolData?.commands ?? []
  )
  const initialLoadedLabwareByAdapter = parseInitialLoadedLabwareByAdapter(
    protocolData?.commands ?? []
  )
  const deckDef = getDeckDefFromRobotType(robotType)
  const labwareByLiquidId = parseLabwareInfoByLiquidId(
    protocolData?.commands ?? []
  )
  const [liquidDetailsLabwareId, setLiquidDetailsLabwareId] = React.useState<
    string | null
  >(null)

  return (
    <Flex
      flex="1"
      maxHeight="80vh"
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_CENTER}
      justifyContent={JUSTIFY_CENTER}
    >
      <RobotWorkSpace
        deckDef={deckDef}
        viewBox={getViewBox(robotType)}
        deckLayerBlocklist={getStandardDeckViewLayerBlockList(robotType)}
        deckFill="#e6e6e6"
        trashSlotName="A3"
        id="LabwareSetup_deckMap"
      >
        {() => (
          <>
            {map(
              moduleRenderInfoById,
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
                              topLabwareId === hoverLabwareId &&
                              labwareHasLiquid
                            }
                          />
                          <LabwareInfoOverlay
                            definition={topLabwareDefinition}
                            labwareId={topLabwareId}
                            displayName={topLabwareDisplayName}
                            runId={runId}
                            hover={
                              topLabwareId === hoverLabwareId &&
                              labwareHasLiquid
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
              labwareRenderInfoById,
              ({ x, y, labwareDef, displayName }, labwareId) => {
                const labwareInAdapter =
                  initialLoadedLabwareByAdapter[labwareId]
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
          </>
        )}
      </RobotWorkSpace>
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
