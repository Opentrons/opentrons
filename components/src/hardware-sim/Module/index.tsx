import * as React from 'react'
import { getModuleDef2, getModuleType, ModuleModel, THERMOCYCLER_MODULE_TYPE } from '@opentrons/shared-data'
import {
  C_MED_LIGHT_GRAY,
  SPACING_1,
  JUSTIFY_CENTER,
  ALIGN_START,
  DISPLAY_FLEX,
  FONT_WEIGHT_SEMIBOLD,
  DIRECTION_COLUMN,
  ALIGN_STRETCH,
  ALIGN_CENTER,
} from '../../styles'
import { RobotCoordsForeignObject } from '../Deck'


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
  statusInfo?: React.ReactNode // contents of small status rectangle, not displayed if absent
  children?: React.ReactNode // contents to be rendered on top of the labware mating surface of the module
}

const statusInfoWrapperProps = {
  display: DISPLAY_FLEX,
  alignItems: ALIGN_CENTER,
}
const statusInfoFlexProps = {
  flexDirection: DIRECTION_COLUMN,
  justifyContent: JUSTIFY_CENTER,
  backgroundColor: C_MED_LIGHT_GRAY,
  padding: SPACING_1,
  fontSize: '0.5rem', // NOTE: this text is rendered into an SVG foreignObject, so sizing is non-standard
  fontWeight: FONT_WEIGHT_SEMIBOLD,
  paddingBottom: SPACING_1,
}

export const Module = (props: Props): JSX.Element => {
  const {
    model,
    x,
    y,
    orientation = 'left',
    innerProps = {},
    statusInfo,
    children
  } = props
  const def = getModuleDef2(model)
  const moduleType = getModuleType(model)

  const {x: labwareOffsetX, y: labwareOffsetY} = def.labwareOffset
  const {x: translateX, y: translateY} = def.cornerOffsetFromSlot
  const {xDimension, yDimension, footprintXDimension, footprintYDimension, labwareInterfaceXDimension, labwareInterfaceYDimension } = def.dimensions


  // apply translation to compensate for the offset of the overall module's
  // left-bottom-front corner, from the footprint's left-bottom-front corner (slot interface)
  const offsetTransform = `translate(${translateX}, ${translateY})`

  // find coordinates of center of footprint, fallback to overall center if not defined
  const rotationCenterX = (footprintXDimension ?? xDimension) / 2
  const rotationCenterY = (footprintYDimension ?? yDimension) / 2

  const orientationTransform = orientation === 'left'
    ? 'rotate(0, 0, 0)'
    : `rotate(180, ${rotationCenterX}, ${rotationCenterY})`

  // transform to be applied to children which render within the labware interfacing surface of the module
  const childrenTransform = `translate(${labwareOffsetX}, ${labwareOffsetY})`

  const renderStatusInfo = () => {
    if(statusInfo == null) return null
    const statusWidth = (labwareInterfaceXDimension ?? xDimension) / 2
    return (
      <RobotCoordsForeignObject
        x={orientation === 'left' ? labwareOffsetX - statusWidth : labwareOffsetX + (labwareInterfaceXDimension ?? xDimension)}
        y={labwareOffsetY}
        height={labwareInterfaceYDimension ?? yDimension}
        width={statusWidth}
        foreignObjectProps={statusInfoWrapperProps}
        flexProps={statusInfoFlexProps}
      >
        {statusInfo}
      </RobotCoordsForeignObject>
    )
  }

  return (
    <g x={x} y={y} data-test={`Module_${moduleType}`}>
      <g transform={orientationTransform}>
        <g transform={offsetTransform}>
          {moduleType === THERMOCYCLER_MODULE_TYPE
            ? (<Thermocycler {...innerProps as React.ComponentProps<typeof Thermocycler>} />)
            : (<ModuleFromDef {...innerProps as React.ComponentProps<typeof ModuleFromDef>} def={def} />)
          }
        </g>
      </g>
      {renderStatusInfo()}
      {children != null
        ? (
          <g transform={childrenTransform}>
            {children}
          </g>
        )
        : null
      }
    </g>
  )
}



