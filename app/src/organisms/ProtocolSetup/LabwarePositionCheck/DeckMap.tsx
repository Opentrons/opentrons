import * as React from 'react'
import map from 'lodash/map'

import { LabwareRender, Module, RobotWorkSpace } from '@opentrons/components'
import {
  THERMOCYCLER_MODULE_V1,
  inferModuleOrientationFromXCoordinate,
} from '@opentrons/shared-data'
import standardDeckDef from '@opentrons/shared-data/deck/definitions/2/ot2_standard.json'
import { useModuleRenderInfoById, useLabwareRenderInfoById } from '../hooks'

import styles from '../styles.css'

const DECK_MAP_VIEWBOX = '-80 -100 550 560'
const DECK_LAYER_BLOCKLIST = [
  'calibrationMarkings',
  'fixedBase',
  'doorStops',
  'metalFrame',
  'removalHandle',
  'removableDeckOutline',
  'screwHoles',
]

export const DeckMap = (): JSX.Element => {
  const moduleRenderInfoById = useModuleRenderInfoById()
  const labwareRenderInfoById = useLabwareRenderInfoById()
  return (
    <RobotWorkSpace
      deckDef={standardDeckDef as any}
      viewBox={DECK_MAP_VIEWBOX}
      className={styles.deck_map}
      deckLayerBlocklist={DECK_LAYER_BLOCKLIST}
      id={'LabwarePositionCheck_deckMap'}
    >
      {() => {
        return (
          <React.Fragment>
            {map(
              moduleRenderInfoById,
              ({ x, y, moduleDef, nestedLabwareDef }) => (
                <Module
                  key={`LabwarePositionCheck_Module_${moduleDef.model}_${x}${y}`}
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
                  {nestedLabwareDef != null ? (
                    <React.Fragment
                      key={`LabwarePositionCheck_Labware_${nestedLabwareDef.metadata.displayName}_${x}${y}`}
                    >
                      <LabwareRender definition={nestedLabwareDef} />
                    </React.Fragment>
                  ) : null}
                </Module>
              )
            )}

            {map(labwareRenderInfoById, ({ x, y, labwareDef }) => {
              return (
                <React.Fragment
                  key={`LabwarePositionCheck_Labware_${labwareDef.metadata.displayName}_${x}${y}`}
                >
                  <g transform={`translate(${x},${y})`}>
                    <LabwareRender definition={labwareDef} />
                  </g>
                </React.Fragment>
              )
            })}
          </React.Fragment>
        )
      }}
    </RobotWorkSpace>
  )
}
