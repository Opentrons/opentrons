import * as React from 'react'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import {
  parseLiquidsInLoadOrder,
  parseLabwareInfoByLiquidId,
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
  const [hoverLabwareId, setHoverLabwareId] = React.useState('')

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
              }) => (
                <Module
                  key={`LabwareSetup_Module_${String(
                    moduleDef.model
                  )}_${x}${y}`}
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
                  {nestedLabwareDef != null && nestedLabwareId != null ? (
                    <React.Fragment
                      key={`LabwareSetup_Labware_${String(
                        nestedLabwareDef.metadata.displayName
                      )}_${x}${y}`}
                    >
                      <LabwareRender definition={nestedLabwareDef} />
                      <LabwareInfoOverlay
                        definition={nestedLabwareDef}
                        labwareId={nestedLabwareId}
                        displayName={nestedLabwareDisplayName}
                        runId={runId}
                      />
                    </React.Fragment>
                  ) : null}
                </Module>
              )
            )}
            {map(
              labwareRenderInfoById,
              ({ x, y, labwareDef, displayName }, labwareId) => {
                const wellFill = getWellFillFromLabwareId(
                  labwareId,
                  liquids,
                  labwareByLiquidId
                )
                const labwareHasLiquid = !isEmpty(wellFill)
                return (
                  <React.Fragment
                    key={`LabwareSetup_Labware_${String(
                      labwareDef.metadata.displayName
                    )}_${x}${y}`}
                  >
                    <g
                      transform={`translate(${x},${y})`}
                      onMouseEnter={() => setHoverLabwareId(labwareId)}
                      onMouseLeave={() => setHoverLabwareId('')}
                      onClick={() =>
                        labwareHasLiquid
                          ? setLiquidDetailsLabwareId(labwareId)
                          : null
                      }
                      cursor={labwareHasLiquid ? 'pointer' : ''}
                    >
                      <LabwareRender
                        definition={labwareDef}
                        wellFill={labwareHasLiquid ? wellFill : undefined}
                        hover={labwareId === hoverLabwareId && labwareHasLiquid}
                      />
                      <LabwareInfoOverlay
                        definition={labwareDef}
                        labwareId={labwareId}
                        displayName={displayName}
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
