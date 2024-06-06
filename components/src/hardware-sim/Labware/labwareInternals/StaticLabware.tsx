// Render labware definition to SVG. XY is in robot coordinates.
import * as React from 'react'
import styled from 'styled-components'
import flatMap from 'lodash/flatMap'

import { LabwareOutline } from './LabwareOutline'
import { Well } from './Well'

import type { LabwareDefinition2, LabwareWell } from '@opentrons/shared-data'
import type { WellMouseEvent } from './types'
import { STYLE_BY_WELL_CONTENTS } from './StyledWells'
import { COLORS } from '../../../helix-design-system'

export interface StaticLabwareProps {
  /** Labware definition to render */
  definition: LabwareDefinition2
  /** Hide labware outline */
  hideOutline?: boolean
  /** Add thicker blurred blue border to labware, defaults to false */
  highlight?: boolean
  /** Optional callback to be executed when entire labware element is clicked */
  onLabwareClick?: () => void
  /** Optional callback to be executed when mouse enters a well element */
  onMouseEnterWell?: (e: WellMouseEvent) => unknown
  /** Optional callback to be executed when mouse leaves a well element */
  onMouseLeaveWell?: (e: WellMouseEvent) => unknown
  /** Provides well data attribute */
  isInteractive?: boolean
}

const TipDecoration = React.memo(function TipDecoration(props: {
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

export function StaticLabwareComponent(props: StaticLabwareProps): JSX.Element {
  const {
    definition,
    hideOutline = false,
    highlight,
    isInteractive,
    onLabwareClick,
    onMouseEnterWell,
    onMouseLeaveWell,
  } = props

  const { isTiprack } = definition.parameters
  return (
    <g onClick={onLabwareClick}>
      {!hideOutline ? (
        <LabwareDetailGroup>
          <LabwareOutline definition={definition} highlight={highlight} />
        </LabwareDetailGroup>
      ) : null}
      <g>
        {flatMap(
          definition.ordering,
          (row: string[], i: number, c: string[][]) => {
            return row.map(wellName => {
              return (
                <React.Fragment key={wellName}>
                  <Well
                    wellName={wellName}
                    well={definition.wells[wellName]}
                    onMouseEnterWell={onMouseEnterWell}
                    onMouseLeaveWell={onMouseLeaveWell}
                    isInteractive={isInteractive}
                    {...(isTiprack
                      ? STYLE_BY_WELL_CONTENTS.tipPresent
                      : STYLE_BY_WELL_CONTENTS.defaultWell)}
                  />

                  {isTiprack ? (
                    <TipDecoration well={definition.wells[wellName]} />
                  ) : null}
                </React.Fragment>
              )
            })
          }
        )}
      </g>
    </g>
  )
}

export const StaticLabware: React.MemoExoticComponent<
  typeof StaticLabwareComponent
> = React.memo(StaticLabwareComponent)
