import * as React from 'react'
import map from 'lodash/map'

import { LabwareRender, Module } from '@opentrons/components'
import {
  inferModuleOrientationFromXCoordinate,
  THERMOCYCLER_MODULE_V1,
} from '@opentrons/shared-data'

import { LabwareDisabledOverlay } from '../LabwareDisabledOverlay'

import type { RunLabwareInfo, RunModuleInfo, LabwareAnimationParams } from './'

export function getModuleRenderComponents(
  moduleRenderInfo: RunModuleInfo[],
  movedLabwareId: string,
  labwareAnimationParams: LabwareAnimationParams
): JSX.Element[] {
  return map(
    moduleRenderInfo,
    ({ x, y, moduleDef, nestedLabwareDef, nestedLabwareId }) => (
      <Module
        key={`InterventionModal_Module_${String(moduleDef.model)}_${x}${y}`}
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
            key={`InterventionModal_Labware_${String(
              nestedLabwareDef.metadata.displayName
            )}_${x}${y}`}
          >
            <LabwareRender
              definition={nestedLabwareDef}
              highlightLabware={movedLabwareId === nestedLabwareId}
              labwareAnimationParams={
                movedLabwareId === nestedLabwareId
                  ? labwareAnimationParams
                  : null
              }
            />
            {movedLabwareId !== nestedLabwareId ? (
              <LabwareDisabledOverlay definition={nestedLabwareDef} />
            ) : null}
          </React.Fragment>
        ) : null}
      </Module>
    )
  )
}

export function getLabwareRenderComponents(
  labwareRenderInfo: RunLabwareInfo[],
  movedLabwareId: string,
  labwareAnimationParams: LabwareAnimationParams
): JSX.Element[] {
  return map(labwareRenderInfo, ({ x, y, labwareDef, labwareId }) => (
    <React.Fragment
      key={`InterventionModal_Labware_${String(
        labwareDef.metadata.displayName
      )}_${x}${y}`}
    >
      <g transform={`translate(${x},${y})`}>
        <LabwareRender
          definition={labwareDef}
          highlightLabware={movedLabwareId === labwareId}
          labwareAnimationParams={
            movedLabwareId === labwareId ? labwareAnimationParams : null
          }
        />
        {movedLabwareId !== labwareId ? (
          <LabwareDisabledOverlay definition={labwareDef} />
        ) : null}
      </g>
    </React.Fragment>
  ))
}
