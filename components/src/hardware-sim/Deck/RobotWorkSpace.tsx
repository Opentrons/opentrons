import { useRef } from 'react'

import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { Svg } from '../../primitives'
import { DeckFromLayers } from './DeckFromLayers'

import type { ReactNode } from 'react'
import type { DeckDefinition, DeckSlot } from '@opentrons/shared-data'
import type { StyleProps } from '../../primitives'

export interface RobotWorkSpaceRenderProps {
  deckSlotsById: { [slotId: string]: DeckSlot }
}

export interface RobotWorkSpaceProps extends StyleProps {
  deckDef?: DeckDefinition

  /**
   * The x/y area to show, in standard SVG `x y xDimension yDimension` syntax.
   *
   * Specify coordinates in the Opentrons orientation, not the standard SVG orientation.
   * So (x, y) is the area's front-left, xDimension extends the viewed area to the
   * right, and yDimension extends the viewed area to the back.
   */
  viewBox?: string | null
  children?: (props: RobotWorkSpaceRenderProps) => ReactNode
  deckLayerBlocklist?: string[]
  // optional boolean to show the OT-2 deck from deck defintion layers
  showDeckLayers?: boolean
  id?: string
}

/**
 * A wrapper for rendering the robot deck, labware, etc. from a top-down perspective.
 *
 * Child SVG components can render themselves in the Opentrons coordinate orientation
 * (+x to the right of the robot, +y to the back of the robot) and this component will
 * SVG-transform them so they're displayed the correct way. This is needed because
 * SVG inverts y compared to Opentrons coordinates.
 */
export function RobotWorkSpace(props: RobotWorkSpaceProps): JSX.Element | null {
  const {
    children,
    deckDef,
    deckLayerBlocklist = [],
    showDeckLayers = false,
    viewBox,
    id,
    ...styleProps
  } = props
  const wrapperRef = useRef<SVGSVGElement>(null)

  if (!deckDef && !viewBox) return null

  let wholeDeckViewBox
  let deckSlotsById = {}
  if (deckDef != null) {
    const [viewBoxOriginX, viewBoxOriginY] = deckDef.cornerOffsetFromOrigin
    const [deckXDimension, deckYDimension] = deckDef.dimensions

    deckSlotsById = deckDef.locations.addressableAreas.reduce(
      (acc, deckSlot) => ({ ...acc, [deckSlot.id]: deckSlot }),
      {}
    )
    wholeDeckViewBox = `${viewBoxOriginX} ${viewBoxOriginY} ${deckXDimension} ${deckYDimension}`
  }

  const activeViewBox = viewBox ?? wholeDeckViewBox

  return (
    <Svg viewBox={activeViewBox} ref={wrapperRef} id={id} {...styleProps}>
      <g
        transform={
          activeViewBox
            ? `scale(1, -1) translate(0, ${
                -1 *
                (Number(activeViewBox?.split(' ')[3]) +
                  2 * Number(activeViewBox?.split(' ')[1]))
              })`
            : undefined
        }
      >
        {showDeckLayers ? (
          <DeckFromLayers
            layerBlocklist={deckLayerBlocklist}
            robotType={OT2_ROBOT_TYPE}
          />
        ) : null}
        {children?.({ deckSlotsById })}
      </g>
    </Svg>
  )
}
