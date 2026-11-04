import { getLabwareViewBox } from '@opentrons/shared-data'

import { COLORS } from '../../../helix-design-system'
import { getTiprackBackgroundColor } from './getTiprackBackgroundColor'

import type { CSSProperties, ReactNode, SVGProps } from 'react'
import type { LabwareDefinition } from '@opentrons/shared-data'

export type LabwareOutlineProps = {
  /** if this labware is a tip rack, darken background and lighten borderx dimension in mm of this labware, used if definition doesn't supply dimensions, defaults to false */
  isTiprack?: boolean
  /** adds thicker blue border with blur to labware, defaults to false */
  highlight?: boolean
  /** adds a drop shadow to the highlight border */
  highlightShadow?: boolean
  /** [legacy] override the border color */
  stroke?: CSSProperties['stroke']
  fill?: CSSProperties['fill']
  showRadius?: boolean
} & (DefinitionProps | DefinitionReplacementProps)

interface DefinitionProps {
  /** Labware definition to outline */
  definition: LabwareDefinition
}

/** Used for rendering an outline without needing a full labware definition. */
interface DefinitionReplacementProps {
  definition?: undefined
  /** x dimension in mm of the outline. */
  width: number
  /** y dimension in mm of the outline. */
  height: number
  /** minimum x-coordinate (i.e. the left side) of the outline. */
  minX: number
  /** minimum y-coordinate (i.e. the bottom) of the outline. */
  minY: number
}

const OUTLINE_THICKNESS_MM = 1

export function LabwareOutline(props: LabwareOutlineProps): ReactNode {
  const {
    definition,
    isTiprack = false,
    highlight = false,
    highlightShadow = false,
    stroke,
    fill,
    showRadius = true,
  } = props

  const { minX, minY, xDimension, yDimension } =
    definition != null
      ? getLabwareViewBox(definition)
      : {
          minX: props.minX,
          minY: props.minY,
          xDimension: props.width,
          yDimension: props.height,
        }

  const { parameters = { isTiprack, loadName: '' } } = definition ?? {}

  let backgroundFill
  if (fill != null) {
    backgroundFill = fill
  } else {
    backgroundFill = parameters.isTiprack
      ? getTiprackBackgroundColor(parameters.loadName)
      : COLORS.white
  }

  return (
    <>
      {highlight ? (
        <>
          <defs>
            <filter id="feOffset" filterUnits="objectBoundingBox">
              {/* *
               * TODO(bh, 2024-08-23): layer drop shadow filters to mimic CSS box shadow - may need to evaluate performance
               * https://stackoverflow.com/questions/22486039/css3-filter-drop-shadow-spread-property-alternatives
               * */}
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="3"
                floodColor={COLORS.blue50}
              />
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="1.75"
                floodColor={COLORS.blue50}
              />
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="1"
                floodColor={COLORS.blue50}
              />
            </filter>
          </defs>
          <LabwareBorder
            borderThickness={2.2 * OUTLINE_THICKNESS_MM}
            minX={minX}
            minY={minY}
            xDimension={xDimension}
            yDimension={yDimension}
            filter={highlightShadow ? 'url(#feOffset)' : ''}
            stroke={COLORS.blue50}
            rx="8"
            ry="8"
            showRadius={showRadius}
            fill={backgroundFill}
          />
        </>
      ) : (
        <LabwareBorder
          borderThickness={OUTLINE_THICKNESS_MM}
          minX={minX}
          minY={minY}
          xDimension={xDimension}
          yDimension={yDimension}
          stroke={stroke ?? (parameters.isTiprack ? '#979797' : COLORS.black90)}
          fill={backgroundFill}
          showRadius={showRadius}
        />
      )}
    </>
  )
}

interface LabwareBorderProps extends SVGProps<SVGRectElement> {
  borderThickness: number
  minX: number
  minY: number
  xDimension: number
  yDimension: number
  showRadius?: boolean
}
function LabwareBorder(props: LabwareBorderProps): ReactNode {
  const {
    borderThickness,
    minX,
    minY,
    xDimension,
    yDimension,
    showRadius = true,
    ...svgProps
  } = props
  return (
    <rect
      x={minX + borderThickness}
      y={minY + borderThickness}
      strokeWidth={2 * borderThickness}
      width={xDimension - 2 * borderThickness}
      height={yDimension - 2 * borderThickness}
      rx={showRadius ? 6 * borderThickness : 0}
      {...svgProps}
    />
  )
}
