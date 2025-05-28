import { Fragment, memo } from 'react'
import map from 'lodash/map'
import styled from 'styled-components'

import {
  getSchema2CornerOffsetFromSlot,
  getSchema2Dimensions,
} from '@opentrons/shared-data'

import { COLORS } from '../../helix-design-system'
import { LabwareAdapter, labwareAdapterLoadNames } from './LabwareAdapter'
import {
  LabwareOutline,
  LabwareWellLabels,
  STYLE_BY_WELL_CONTENTS,
  Well,
} from './labwareInternals'

import type { RefObject } from 'react'
import type { LabwareDefinition, LabwareWell } from '@opentrons/shared-data'
import type { LabwareAdapterLoadName } from './LabwareAdapter'
import type {
  HighlightedWellLabels,
  WellFill,
  WellMouseEvent,
  WellStroke,
} from './labwareInternals/types'

export interface LabwareProps {
  /** Labware definition to render */
  definition: LabwareDefinition
  /** Opional Prop for labware on heater shakers sitting on right side of the deck */
  shouldRotateAdapterOrientation?: boolean
  /** boolean to show well labels */
  showLabels?: boolean
  /** color to render well labels */
  wellLabelColor?: string
  /** option to highlight well labels with specified color */
  highlightedWellLabels?: HighlightedWellLabels
  /** CSS color to fill specified wells */
  wellFill?: WellFill
  /** CSS color to stroke specified wells */
  wellStroke?: WellStroke
  /** adds thicker blue border with blur to labware */
  highlight?: boolean
  /** Optional callback, called with WellMouseEvent args onMouseEnter */
  onMouseEnterWell?: (e: WellMouseEvent) => unknown
  /** Optional callback, called with WellMouseEvent args onMouseLeave */
  onMouseLeaveWell?: (e: WellMouseEvent) => unknown
  gRef?: RefObject<SVGGElement>
  onLabwareClick?: () => void
  /** Hide labware outline */
  hideOutline?: boolean
  /** Provides well data attribute */
  isInteractive?: boolean
}

const TipDecoration = memo(function TipDecoration(props: {
  well: LabwareWell
}) {
  const { well } = props
  if (well.shape === 'circular') {
    const radius = well.diameter / 2
    return (
      <circle
        {...STYLE_BY_WELL_CONTENTS.tipPresent}
        cx={well.x}
        cy={well.y}
        r={radius - 1}
      />
    )
  }
  return null
})

const LabwareDetailGroup = styled.g`
  fill: none;
  stroke: ${COLORS.black90};
  stroke-width: 1;
`

/**
 * Similar to the LabwareRender component, but with ODD-specific styling.
 *
 * For example, hiding the outline of the labware for certain ODD flows.
 */
export const Labware = (props: LabwareProps): JSX.Element => {
  const {
    definition,
    gRef,
    hideOutline = false,
    highlight,
    highlightedWellLabels,
    isInteractive,
    onLabwareClick,
    onMouseEnterWell,
    onMouseLeaveWell,
    showLabels = false,
    wellFill = {},
    wellLabelColor,
    wellStroke = {},
  } = props

  const cornerOffsetFromSlot = getSchema2CornerOffsetFromSlot(definition)
  const labwareLoadName = definition.parameters.loadName

  if (labwareAdapterLoadNames.includes(labwareLoadName)) {
    const { shouldRotateAdapterOrientation = false } = props
    const { xDimension, yDimension } = getSchema2Dimensions(definition)

    return (
      <g
        transform={
          shouldRotateAdapterOrientation
            ? `rotate(180, ${xDimension / 2}, ${yDimension / 2})`
            : 'rotate(0, 0, 0)'
        }
      >
        <g
          transform={`translate(${cornerOffsetFromSlot.x}, ${cornerOffsetFromSlot.y})`}
          ref={gRef}
        >
          <LabwareAdapter
            labwareLoadName={labwareLoadName as LabwareAdapterLoadName}
          />
        </g>
      </g>
    )
  }

  const { isTiprack } = definition.parameters

  return (
    <g
      transform={`translate(${cornerOffsetFromSlot.x}, ${cornerOffsetFromSlot.y})`}
      ref={gRef}
    >
      <g onClick={onLabwareClick}>
        {!hideOutline ? (
          <LabwareDetailGroup>
            <LabwareOutline definition={definition} highlight={highlight} />
          </LabwareDetailGroup>
        ) : null}
        <g>
          {map(definition.wells, (well, wellName) => {
            return (
              <Fragment key={wellName}>
                <Well
                  wellName={wellName}
                  well={well}
                  onMouseEnterWell={onMouseEnterWell}
                  onMouseLeaveWell={onMouseLeaveWell}
                  isInteractive={isInteractive}
                  {...(isTiprack
                    ? STYLE_BY_WELL_CONTENTS.tipPresent
                    : STYLE_BY_WELL_CONTENTS.defaultWell)}
                  fill={wellFill[wellName]}
                  stroke={wellStroke[wellName]}
                />

                {isTiprack ? <TipDecoration well={well} /> : null}
              </Fragment>
            )
          })}
        </g>
      </g>
      {showLabels && definition.metadata.displayCategory !== 'adapter' ? (
        <LabwareWellLabels
          definition={definition}
          wellLabelColor={wellLabelColor}
          highlightedWellLabels={highlightedWellLabels}
        />
      ) : null}
    </g>
  )
}
