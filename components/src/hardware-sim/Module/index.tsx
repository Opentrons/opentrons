import * as React from 'react'
import { getModuleDef2, getModuleType, ModuleModel, THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import { Thermocycler } from './Thermocycler'
import { ModuleFromDef } from './ModuleFromDef'

export * from './Thermocycler'
export * from './ModuleFromDef'

interface Props {
  x: number
  y: number
  model: ModuleModel
  orientation?: 'left' | 'right'
  innerProps?: React.ComponentProps<typeof Thermocycler> | React.ComponentProps<typeof ModuleFromDef>
}

export const Module = (props: Props): JSX.Element => {
  const {
    model,
    x,
    y,
    orientation = 'left',
    innerProps = {},
  } = props
  const def = getModuleDef2(model)
  const moduleType = getModuleType(model)
  if(moduleType === THERMOCYCLER_MODULE_TYPE) {
    return <Thermocycler {...innerProps as React.ComponentProps<typeof Thermocycler>} />
  }

  const {x: translateX, y: translateY} = def.cornerOffsetFromSlot
  const {xDimension, yDimension, footprintXDimension, footprintYDimension} = def.dimensions

  // apply translation to compensate for the offset of the overall module's
  // left-bottom-front corner, from the footprint's (slot interface)
  const offsetTransform = `translate(${translateX}, ${translateY})`

  // find coordinates of center of footprint, fallback to overall center if not defined
  const rotationCenterX = (footprintXDimension ?? xDimension) / 2
  const rotationCenterY = (footprintYDimension ?? yDimension) / 2

  const orientationTransform = orientation === 'left'
    ? 'rotate(0, 0, 0)'
    : `rotate(180, ${rotationCenterX}, ${rotationCenterY})`

  return (
    <g data-test={`Module_${moduleType}`} x={x} y={y} transform={orientationTransform}>
      <g transform={offsetTransform}>
        <ModuleFromDef
          {...innerProps as React.ComponentProps<typeof ModuleFromDef>}
          def={def} />
      </g>
    </g>
  )
}
