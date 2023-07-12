import * as React from 'react'

import { getModuleDef2, TEMPERATURE_MODULE_V1 } from '@opentrons/shared-data'

import { COLORS } from '../../ui-style-constants'
import { RobotCoordsForeignDiv } from '../Deck'
import { ModuleFromDef } from './ModuleFromDef'

export interface TemperatureVizProps {
  targetTemperature: number | null
}

const ROOM_TEMPERATURE_C = 23

export function Temperature(props: TemperatureVizProps): JSX.Element {
  const { targetTemperature } = props
  const def = getModuleDef2(TEMPERATURE_MODULE_V1)
  let ledLightOverlay: JSX.Element | null = null
  if (targetTemperature != null) {
    ledLightOverlay = (
      <RobotCoordsForeignDiv
        width="5.5"
        height="16"
        x="23"
        y="36.5"
        innerDivProps={{
          borderRadius: '6px',
          backgroundColor:
            targetTemperature <= ROOM_TEMPERATURE_C
              ? COLORS.mediumBlueEnabled
              : COLORS.red4,
          width: '100%',
          height: '100%',
        }}
      />
    )
  }

  return (
    <>
      <ModuleFromDef def={def} />
      {ledLightOverlay}
    </>
  )
}
