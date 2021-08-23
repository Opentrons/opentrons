import * as React from 'react'
import { getModuleDef2, getModuleType, ModuleModel, THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import { Thermocycler } from './Thermocycler'
import { ModuleFromDef } from './ModuleFromDef'

export * from './Thermocycler'
export * from './TemperatureModule'
export * from './ModuleFromDef'

interface Props {
  x: number
  y: number
  model: ModuleModel
  orientation?: 'left' | 'right'
  innerProps?: React.ComponentProps<typeof Thermocycler> | React.ComponentProps<typeof ModuleFromDef>
}

export const Module = (props: Props): JSX.Element => {
  const { model, x, y, orientation = 'left' }= props
  const def = getModuleDef2(model)
  const moduleType = getModuleType(model)
  if(moduleType === THERMOCYCLER_MODULE_TYPE) {
    return <Thermocycler {...props.innerProps as React.ComponentProps<typeof Thermocycler>} />
  }

  const translateX = def.cornerOffsetFromSlot.x
  const translateY = def.cornerOffsetFromSlot.y
  const offsetTransform = `translate(${translateX}, ${translateY})`

  const rotationCenterX = def.dimensions.footprintXDimension / 2
  const rotationCenterY = def.dimensions.footprintYDimension / 2

  const orientationTransform = orientation === 'left'
    ? 'rotate(0, 0, 0)'
    : `rotate(180, ${rotationCenterX}, ${rotationCenterY})`


  return (
    <g data-test={`Module_${moduleType}`} x={x} y={y} transform={orientationTransform}>
      <g transform={offsetTransform}>
        <ModuleFromDef def={def} />
      </g>
    </g>
  )
}
