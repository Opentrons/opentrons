import {
  ABSORBANCE_READER_TYPE,
  FLEX_STACKER_MODULE_TYPE,
  getModuleType,
  HEATERSHAKER_MODULE_TYPE,
  IDENTITY_AFFINE_TRANSFORM,
  MAGNETIC_BLOCK_TYPE,
  MAGNETIC_MODULE_TYPE,
  multiplyMatrices,
  TEMPERATURE_MODULE_TYPE,
  THERMOCYCLER_MODULE_TYPE,
} from '@opentrons/shared-data'

import {
  ALIGN_CENTER,
  C_DARK_GRAY,
  C_MED_LIGHT_GRAY,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  FONT_WEIGHT_SEMIBOLD,
  JUSTIFY_CENTER,
  SPACING_1,
} from '../../styles'
import { RobotCoordsForeignObject } from '../Deck'
import { FlexStacker } from './FlexStacker'
import { HeaterShaker } from './HeaterShaker'
import { MagneticBlock } from './MagneticBlock'
import { MagneticModule } from './MagneticModule'
import { PlateReader } from './PlateReader'
import { Temperature } from './Temperature'
import { Thermocycler } from './Thermocycler'

import type { ComponentProps, ReactNode } from 'react'
import type {
  ModuleDefinition,
  ThermocyclerModuleModel,
} from '@opentrons/shared-data'
import type { FlexDirection } from '../Deck'

export * from './alignToModule'
export * from './Thermocycler'

interface Props {
  /**
   * The x-coordinate of the module origin,
   * which is the -x,-y corner of the slot that the module is in.
   */
  x: number
  /**
   * The y-coordinate of the module origin,
   * which is the -x,-y corner of the slot that the module is in.
   */
  y: number

  def: ModuleDefinition
  orientation?: 'left' | 'right'
  innerProps?:
    | ComponentProps<typeof Thermocycler>
    | ComponentProps<typeof HeaterShaker>
    | ComponentProps<typeof Temperature>
    | {}
  statusInfo?: ReactNode /** contents of small status rectangle, not displayed if absent */

  /**
   * Contents to be rendered above and as part of the module, typically labware.
   * Use a helper component like `<AlignLabwareToModule>` to position them properly.
   */
  children?: ReactNode

  /**
   * How child components should be positioned.
   *
   * "offsetToSlot" - The SVG origin of a child will be at the labware mating interface of the
   *   module, which is the front-left (-x, -y) corner of the slot on top of the module.
   *
   * todo(mm, 2025-07-21):
   * 1. Add a "passThrough" mode that disables the "offsetToSlot" behavior,
   *    to allow child components to replace it with their own SVG transform,
   *    to support labware schema 3.
   * 2. Migrate all existing call sites to use "passThrough".
   * 3. Remove "offsetToSlot".
   */
  childrenPositioningMode: 'offsetToSlot'

  /**
   * Used for applying slot-specific positioning adjustments.
   * If you're rendering the module on a deck, supply this for correct positioning.
   */
  targetSlotId: string | null
  /**
   * Used for applying slot-specific positioning adjustments.
   * If you're rendering the module on a deck, supply this for correct positioning.
   */
  targetDeckId: string | null
}

const statusInfoWrapperProps = {
  display: DISPLAY_FLEX,
  alignItems: ALIGN_CENTER,
}
const statusInfoFlexProps = {
  flexDirection: DIRECTION_COLUMN as FlexDirection,
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
    targetSlotId,
    targetDeckId,
  } = props

  const moduleType = getModuleType(def.model)

  const {
    xDimension,
    yDimension,
    footprintXDimension,
    footprintYDimension,
    labwareInterfaceXDimension,
    labwareInterfaceYDimension,
  } = def.dimensions

  // apply translation to position module in viewport
  const parentSlotPositionTransform = `translate(${x}, ${y})`

  const transformsForLocation =
    targetSlotId != null && targetDeckId != null
      ? def.slotTransforms[targetDeckId]?.[targetSlotId] ?? {}
      : {}

  // apply translation to compensate for the offset of the overall module's
  // left-bottom-front corner, from the footprint's left-bottom-front corner (slot interface)
  const [
    [slotTranslateX],
    [slotTranslateY],
  ] = multiplyMatrices(
    transformsForLocation.cornerOffsetFromSlot ?? IDENTITY_AFFINE_TRANSFORM,
    [
      [def.cornerOffsetFromSlot.x],
      [def.cornerOffsetFromSlot.y],
      [def.cornerOffsetFromSlot.z],
      [1],
    ]
  )
  const offsetTransform = `translate(${slotTranslateX}, ${slotTranslateY})`

  // find coordinates of center of footprint, fallback to overall center if not defined
  const rotationCenterX = (footprintXDimension ?? xDimension) / 2
  const rotationCenterY = (footprintYDimension ?? yDimension) / 2

  const orientationTransform =
    orientation === 'left' ||
    moduleType === ABSORBANCE_READER_TYPE ||
    moduleType === FLEX_STACKER_MODULE_TYPE
      ? 'rotate(0, 0, 0)'
      : `rotate(180, ${rotationCenterX}, ${rotationCenterY})`

  const renderStatusInfo = (): JSX.Element | null => {
    if (statusInfo == null) return null
    const statusWidth = (labwareInterfaceXDimension ?? xDimension) / 2
    return (
      <RobotCoordsForeignObject
        x={
          orientation === 'left'
            ? def.labwareOffset.x - statusWidth
            : def.labwareOffset.x + (labwareInterfaceXDimension ?? xDimension)
        }
        y={def.labwareOffset.y}
        height={labwareInterfaceYDimension ?? yDimension}
        width={statusWidth}
        foreignObjectProps={statusInfoWrapperProps}
        flexProps={statusInfoFlexProps}
      >
        {statusInfo}
      </RobotCoordsForeignObject>
    )
  }

  let moduleViz: JSX.Element | null = null
  if (moduleType === MAGNETIC_BLOCK_TYPE) {
    moduleViz = <MagneticBlock />
  } else if (moduleType === MAGNETIC_MODULE_TYPE) {
    moduleViz = <MagneticModule />
  } else if (moduleType === THERMOCYCLER_MODULE_TYPE) {
    const thermocyclerProps = {
      lidMotorState: 'open' as const,
      ...innerProps,
      model: def.model as ThermocyclerModuleModel,
    }

    moduleViz = <Thermocycler {...thermocyclerProps} />
  } else if (moduleType === HEATERSHAKER_MODULE_TYPE) {
    moduleViz = (
      <HeaterShaker {...(innerProps as ComponentProps<typeof HeaterShaker>)} />
    )
  } else if (moduleType === TEMPERATURE_MODULE_TYPE) {
    moduleViz = (
      <Temperature {...(innerProps as ComponentProps<typeof Temperature>)} />
    )
  } else if (moduleType === ABSORBANCE_READER_TYPE) {
    moduleViz = <PlateReader />
  } else if (moduleType === FLEX_STACKER_MODULE_TYPE) {
    moduleViz = <FlexStacker />
  }
  return (
    <g
      transform={parentSlotPositionTransform}
      data-test={`Module_${moduleType}`}
    >
      <g transform={orientationTransform}>
        <g transform={offsetTransform} style={{ fill: C_DARK_GRAY }}>
          {moduleViz}
        </g>
      </g>
      {renderStatusInfo()}
      {children}
    </g>
  )
}
