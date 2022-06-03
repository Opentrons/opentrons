import * as React from 'react'
import map from 'lodash/map'
import {
  DIRECTION_COLUMN,
  Flex,
  RobotWorkSpace,
  LabwareRender,
  Module,
} from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/3/ot2_standard.json'
import { LabwareInfoOverlay } from '../LabwareInfoOverlay'
import {
  useLabwareRenderInfoForRunById,
  useModuleRenderInfoForProtocolById,
} from '../../hooks'
import type { DeckDefinition } from '@opentrons/shared-data'
import type { Liquid } from './getMockLiquidData'

const DECK_MAP_VIEWBOX = '-80 -40 550 500'
const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

interface SetupLiquidsMapProps {
  runId: string
  robotName: string
  liquids: Liquid[]
}

export function SetupLiquidsMap(props: SetupLiquidsMapProps): JSX.Element {
  const { runId, robotName, liquids } = props
  const moduleRenderInfoById = useModuleRenderInfoForProtocolById(
    robotName,
    runId
  )
  const labwareRenderInfoById = useLabwareRenderInfoForRunById(runId)

  return (
    <Flex flex="1" maxHeight="180vh" flexDirection={DIRECTION_COLUMN}>
      <RobotWorkSpace
        deckDef={(standardDeckDef as unknown) as DeckDefinition}
        viewBox={DECK_MAP_VIEWBOX}
        deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
        id={'LabwareSetup_deckMap'}
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
                  key={`LabwareSetup_Module_${moduleDef.model}_${x}${y}`}
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
                      key={`LabwareSetup_Labware_${nestedLabwareDef.metadata.displayName}_${x}${y}`}
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
                let wellFill = {}
                liquids.forEach(liquid => {
                  if (liquid.labwareId === labwareId) {
                    const liquidWellFill = { ...liquid.volumeByWell }
                    Object.keys(liquidWellFill).forEach(key => {
                      liquidWellFill[key] = liquid?.displayColor
                    })
                    wellFill = { ...wellFill, ...liquidWellFill }
                  }
                })
                return (
                  <React.Fragment
                    key={`LabwareSetup_Labware_${labwareDef.metadata.displayName}_${x}${y}`}
                  >
                    <g transform={`translate(${x},${y})`}>
                      <LabwareRender
                        definition={labwareDef}
                        wellFill={wellFill != null ? wellFill : undefined}
                      />
                      <LabwareInfoOverlay
                        definition={labwareDef}
                        labwareId={labwareId}
                        displayName={displayName}
                        runId={runId}
                      />
                    </g>
                  </React.Fragment>
                )
              }
            )}
          </>
        )}
      </RobotWorkSpace>
    </Flex>
  )
}
