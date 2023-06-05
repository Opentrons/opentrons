import * as React from 'react'
import {
  getModuleType,
  MAGNETIC_BLOCK_TYPE,
  ModuleDefinition,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  C_DARK_GRAY,
  C_MED_LIGHT_GRAY,
  SPACING_1,
  JUSTIFY_CENTER,
  DISPLAY_FLEX,
  FONT_WEIGHT_SEMIBOLD,
  DIRECTION_COLUMN,
  ALIGN_CENTER,
} from '../../styles'
import { RobotCoordsForeignObject } from '../Deck'

import { Thermocycler } from './Thermocycler'
import { ModuleFromDef } from './ModuleFromDef'

export * from './Thermocycler'
export * from './ModuleFromDef'

const LABWARE_OFFSET_DISPLAY_THRESHOLD = 2
interface Props {
  x: number
  y: number
  def: ModuleDefinition
  orientation?: 'left' | 'right'
  innerProps?:
    | React.ComponentProps<typeof Thermocycler>
    | React.ComponentProps<typeof ModuleFromDef>
    | {}
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
    def,
    x,
    y,
    orientation = 'left',
    innerProps = {},
    statusInfo,
    children,
  } = props
  const moduleType = getModuleType(def.model)

  const { x: labwareOffsetX, y: labwareOffsetY } = def.labwareOffset
  const { x: translateX, y: translateY } = def.cornerOffsetFromSlot
  const {
    xDimension,
    yDimension,
    footprintXDimension,
    footprintYDimension,
    labwareInterfaceXDimension,
    labwareInterfaceYDimension,
  } = def.dimensions

  // apply translation to position module in viewport
  const positionTransform = `translate(${x}, ${y})`

  // apply translation to compensate for the offset of the overall module's
  // left-bottom-front corner, from the footprint's left-bottom-front corner (slot interface)
  const offsetTransform = `translate(${translateX}, ${translateY})`

  // find coordinates of center of footprint, fallback to overall center if not defined
  const rotationCenterX = (footprintXDimension ?? xDimension) / 2
  const rotationCenterY = (footprintYDimension ?? yDimension) / 2

  const orientationTransform =
    orientation === 'left'
      ? 'rotate(0, 0, 0)'
      : `rotate(180, ${rotationCenterX}, ${rotationCenterY})`

  // labwareOffset values are more accurate than our SVG renderings, so ignore any deviations under a certain threshold
  const clampedLabwareOffsetX =
    Math.abs(labwareOffsetX) > LABWARE_OFFSET_DISPLAY_THRESHOLD
      ? labwareOffsetX
      : 0
  const clampedLabwareOffsetY =
    Math.abs(labwareOffsetY) > LABWARE_OFFSET_DISPLAY_THRESHOLD
      ? labwareOffsetY
      : 0
  // transform to be applied to children which render within the labware interfacing surface of the module
  const childrenTransform = `translate(${clampedLabwareOffsetX}, ${clampedLabwareOffsetY})`

  const renderStatusInfo = (): JSX.Element | null => {
    if (statusInfo == null) return null
    const statusWidth = (labwareInterfaceXDimension ?? xDimension) / 2
    return (
      <RobotCoordsForeignObject
        x={
          orientation === 'left'
            ? labwareOffsetX - statusWidth
            : labwareOffsetX + (labwareInterfaceXDimension ?? xDimension)
        }
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

  const magneticBlockLayerBlockList = ['Module_Title', 'Well_Labels', 'Wells']

  return (
    <g transform={positionTransform} data-test={`Module_${moduleType}`}>
      <g transform={orientationTransform}>
        <g transform={offsetTransform} style={{ fill: C_DARK_GRAY }}>
          {moduleType === THERMOCYCLER_MODULE_TYPE ? (
            <Thermocycler
              {...(innerProps as React.ComponentProps<typeof Thermocycler>)}
            />
          ) : (
            <ModuleFromDef
              layerBlocklist={
                moduleType === MAGNETIC_BLOCK_TYPE
                  ? magneticBlockLayerBlockList
                  : undefined
              }
              {...(innerProps as React.ComponentProps<typeof ModuleFromDef>)}
              def={def}
            />
          )}
        </g>
      </g>
      {renderStatusInfo()}
      {children != null ? (
        <g transform={childrenTransform}>{children}</g>
      ) : null}
    </g>
  )
}
