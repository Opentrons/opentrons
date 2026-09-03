import { useRef } from 'react'

import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { DeckFromLayers } from './DeckFromLayers'

import type { CSSProperties, ReactNode } from 'react'
import type { AddressableArea, DeckDefinition } from '@opentrons/shared-data'

export interface RobotWorkSpaceRenderProps {
  // todo(mm, 2025-06-05): Is this API still worthwhile? The parent of RobotWorkSpace
  // already has access to the full DeckDefinition. Maybe it should iterate over
  // the DeckDefinition's AddressableAreas itself?
  addressableAreasById: { [addressableAreaId: string]: AddressableArea }
}

type BaseProps = {
  children?: (props: RobotWorkSpaceRenderProps) => ReactNode
  deckLayerBlocklist?: string[]
  /** optional boolean to show the OT-2 deck from deck defintion layers */
  showDeckLayers?: boolean
  id?: string
} & (
  | // Require at least one of deckDef or viewBox,
    {
      deckDef: DeckDefinition
    }
  | {
      /**
       * The x/y area to show, in standard SVG `x y xDimension yDimension` syntax.
       *
       * Specify coordinates in the Opentrons orientation, not the standard SVG orientation.
       * So (x, y) is the area's front-left, xDimension extends the viewed area to the
       * right, and yDimension extends the viewed area to the back.
       */
      viewBox: string
    }
)

export type RobotWorkSpaceProps = BaseProps & CSSProperties

/**
 * A wrapper for rendering the robot deck, labware, etc. from a top-down perspective.
 *
 * Child SVG components can render themselves in the Opentrons coordinate orientation
 * (+x to the right of the robot, +y to the back of the robot) and this component will
 * SVG-transform them so they're displayed the correct way. This is needed because
 * SVG inverts y compared to Opentrons coordinates.
 */
export function RobotWorkSpace(props: RobotWorkSpaceProps): ReactNode {
  const {
    children,
    deckLayerBlocklist = [],
    showDeckLayers = false,
    id,
    ...styleProps
  } = props
  const activeViewBox = getViewBoxFromProps(props)
  const addressableAreasById = getAddressableAreasByIdFromProps(props)
  const wrapperRef = useRef<SVGSVGElement>(null)

  return (
    <svg
      viewBox={activeViewBox}
      ref={wrapperRef}
      id={id}
      style={{ ...styleProps }}
    >
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
        {children?.({ addressableAreasById })}
      </g>
    </svg>
  )
}

function getAddressableAreasByIdFromProps(
  props: RobotWorkSpaceProps
): RobotWorkSpaceRenderProps['addressableAreasById'] {
  if ('deckDef' in props) {
    return Object.fromEntries(
      props.deckDef.locations.addressableAreas.map(addressableArea => [
        addressableArea.id,
        addressableArea,
      ])
    )
  } else {
    return {}
  }
}

function getViewBoxFromProps(props: RobotWorkSpaceProps): string {
  if ('viewBox' in props) {
    // An explicitly provided viewBox takes precedence.
    return props.viewBox
  } else {
    return getWholeDeckViewBox(props.deckDef)
  }
}

function getWholeDeckViewBox(deckDef: DeckDefinition): string {
  const [viewBoxOriginX, viewBoxOriginY] = deckDef.cornerOffsetFromOrigin
  const [deckXDimension, deckYDimension] = deckDef.dimensions
  return `${viewBoxOriginX} ${viewBoxOriginY} ${deckXDimension} ${deckYDimension}`
}
