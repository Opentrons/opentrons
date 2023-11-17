// Render labware definition to SVG. XY is in robot coordinates.
import assert from 'assert'
import * as React from 'react'
import flatMap from 'lodash/flatMap'

import { LabwareOutline } from './LabwareOutline'
import { Well } from './Well'
import styles from './StaticLabware.css'

import type { LabwareDefinition2, LabwareWell } from '@opentrons/shared-data'
import type { WellMouseEvent } from './types'

export interface StaticLabwareProps {
  /** Labware definition to render */
  definition: LabwareDefinition2
  /** Add thicker blurred blue border to labware, defaults to false */
  highlight?: boolean
  /** Optional callback to be executed when entire labware element is clicked */
  onLabwareClick?: () => void
  /** Optional callback to be executed when mouse enters a well element */
  onMouseEnterWell?: (e: WellMouseEvent) => unknown
  /** Optional callback to be executed when mouse leaves a well element */
  onMouseLeaveWell?: (e: WellMouseEvent) => unknown
  /** [legacy] css class to be added to well component if it is selectable */
  selectableWellClass?: string
}

const TipDecoration = React.memo(function TipDecoration(props: {
  well: LabwareWell
}) {
  const { well } = props
  if ('diameter' in well && well.diameter != null) {
    const radius = well.diameter / 2
    return (
      <circle className={styles.tip} cx={well.x} cy={well.y} r={radius - 1} />
    )
  }
  assert(false, `TipDecoration expects a circular well with a diameter`)
  return null
})

export function StaticLabwareComponent(props: StaticLabwareProps): JSX.Element {
  const { isTiprack } = props.definition.parameters
  return (
    <g onClick={props.onLabwareClick}>
      <g className={styles.labware_detail_group}>
        <LabwareOutline
          definition={props.definition}
          highlight={props.highlight}
        />
      </g>
      <g>
        {flatMap(
          props.definition.ordering,
          (row: string[], i: number, c: string[][]) => {
            return row.map(wellName => {
              return (
                <React.Fragment key={wellName}>
                  <Well
                    className={isTiprack ? styles.tip : null}
                    wellName={wellName}
                    well={props.definition.wells[wellName]}
                    onMouseEnterWell={props.onMouseEnterWell}
                    onMouseLeaveWell={props.onMouseLeaveWell}
                    selectableWellClass={props.selectableWellClass}
                  />

                  {/* Tip inner circle decoration.
                   TODO: Ian 2019-05-03 SOMEDAY, use WellDecoration and include decorations in the def */}
                  {isTiprack && (
                    <TipDecoration well={props.definition.wells[wellName]} />
                  )}
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
