import * as React from 'react'
import { SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT } from '@opentrons/shared-data'
import { COLORS } from '../../../helix-design-system'

import type { CSSProperties } from 'styled-components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

export interface LabwareOutlineProps {
  /** Labware definition to outline */
  definition?: LabwareDefinition2
  /** x dimension in mm of this labware, used if definition doesn't supply dimensions, defaults to 127.76 */
  width?: number
  /** y dimension in mm of this labware, used if definition doesn't supply dimensions, defaults to 85.48 */
  height?: number
  /** if this labware is a tip rack, darken background and lighten borderx dimension in mm of this labware, used if definition doesn't supply dimensions, defaults to false */
  isTiprack?: boolean
  /** adds thicker blue border with blur to labware, defaults to false */
  highlight?: boolean
  /** [legacy] override the border color */
  stroke?: CSSProperties['stroke']
  fill?: CSSProperties['fill']
  showRadius?: boolean
}

const OUTLINE_THICKNESS_MM = 1

export function LabwareOutline(props: LabwareOutlineProps): JSX.Element {
  const {
    definition,
    width = SLOT_RENDER_WIDTH,
    height = SLOT_RENDER_HEIGHT,
    isTiprack = false,
    highlight = false,
    stroke,
    fill,
    showRadius = true,
  } = props
  const {
    parameters = { isTiprack },
    dimensions = { xDimension: width, yDimension: height },
  } = definition ?? {}

  let backgroundFill
  if (fill != null) {
    backgroundFill = fill
  } else {
    backgroundFill = parameters.isTiprack ? '#CCCCCC' : COLORS.white
  }
  return (
    <>
      {highlight ? (
        <>
          <defs>
            <filter id="feOffset" filterUnits="objectBoundingBox">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>
          {/* TODO(bh, 2024-07-22): adjust gaussian blur for stacks */}
          <LabwareBorder
            borderThickness={1.5 * OUTLINE_THICKNESS_MM}
            xDimension={dimensions.xDimension}
            yDimension={dimensions.yDimension}
            filter="url(#feOffset)"
            stroke="#74B0FF"
            rx="8"
            ry="8"
            showRadius={showRadius}
            fill={backgroundFill}
          />
          <LabwareBorder
            borderThickness={2.2 * OUTLINE_THICKNESS_MM}
            xDimension={dimensions.xDimension}
            yDimension={dimensions.yDimension}
            stroke={COLORS.blue50}
            fill={backgroundFill}
            rx="4"
            ry="4"
            showRadius={showRadius}
          />
        </>
      ) : (
        <LabwareBorder
          borderThickness={OUTLINE_THICKNESS_MM}
          xDimension={dimensions.xDimension}
          yDimension={dimensions.yDimension}
          stroke={stroke ?? (parameters.isTiprack ? '#979797' : COLORS.black90)}
          fill={backgroundFill}
          showRadius={showRadius}
        />
      )}
    </>
  )
}

interface LabwareBorderProps extends React.SVGProps<SVGRectElement> {
  borderThickness: number
  xDimension: number
  yDimension: number
  showRadius?: boolean
}
function LabwareBorder(props: LabwareBorderProps): JSX.Element {
  const {
    borderThickness,
    xDimension,
    yDimension,
    showRadius = true,
    ...svgProps
  } = props
  return (
    <rect
      x={borderThickness}
      y={borderThickness}
      strokeWidth={2 * borderThickness}
      width={xDimension - 2 * borderThickness}
      height={yDimension - 2 * borderThickness}
      rx={showRadius ? 6 * borderThickness : 0}
      {...svgProps}
    />
  )
}
