import { Fragment, memo } from 'react'
import map from 'lodash/map'
import styled from 'styled-components'

import {
  getSchema2CornerOffsetFromSlot,
  getSchema2Dimensions,
} from '@opentrons/shared-data'

import { COLORS } from '../../helix-design-system'
import { customSVGLoadNames, LabwareAdapter } from './LabwareAdapter'
import {
  LabwareOutline,
  LabwareWellLabels,
  STYLE_BY_WELL_CONTENTS,
  Well,
} from './labwareInternals'

import type { ReactNode, RefObject } from 'react'
import type { LabwareDefinition, LabwareWell } from '@opentrons/shared-data'
import type { LabwareAdapterLoadName } from './LabwareAdapter'
import type {
  HighlightedWellLabels,
  WellFillByName,
  WellMouseEvent,
  WellStrokeByName,
} from './labwareInternals/Wells'

export interface LabwareProps {
  /** Labware definition to render */
  definition: LabwareDefinition
  /* See docs on LabwareRender. */
  positioningMode: 'passThrough' | 'offsetInSlot'
  /** See docs on LabwareRender. */
  shouldRotateAdapterOrientation?: boolean
  /** boolean to show well labels */
  showLabels?: boolean
  /** color to render well labels */
  wellLabelColor?: string
  /** option to highlight well labels with specified color */
  highlightedWellLabels?: HighlightedWellLabels
  /** CSS color to fill specified wells */
  wellFill?: WellFillByName
  /** CSS color to stroke specified wells */
  wellStroke?: WellStrokeByName
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
export const Labware = (props: LabwareProps): ReactNode => {
  const {
    definition,
    positioningMode,
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
  const isNeedingCustomSVG = customSVGLoadNames.includes(labwareLoadName)
  const isLid = definition.allowedRoles?.includes('lid')
  if (isNeedingCustomSVG || isLid) {
    const { shouldRotateAdapterOrientation = false } = props
    const { xDimension, yDimension } = getSchema2Dimensions(definition)
    const lidDimensions =
      'dimensions' in definition ? definition.dimensions : null

    return (
      <g
        transform={
          positioningMode === 'offsetInSlot' && shouldRotateAdapterOrientation
            ? `rotate(180, ${xDimension / 2}, ${yDimension / 2})`
            : undefined
        }
      >
        <g
          transform={
            positioningMode === 'offsetInSlot'
              ? `translate(${cornerOffsetFromSlot.x}, ${cornerOffsetFromSlot.y})`
              : undefined
          }
          ref={gRef}
        >
          <LabwareAdapter
            labwareLoadName={labwareLoadName as LabwareAdapterLoadName}
            isLid={isLid}
            lidDimensions={lidDimensions}
          />
        </g>
      </g>
    )
  }

  const { isTiprack } = definition.parameters

  return (
    <g
      transform={
        positioningMode === 'offsetInSlot'
          ? `translate(${cornerOffsetFromSlot.x}, ${cornerOffsetFromSlot.y})`
          : undefined
      }
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
