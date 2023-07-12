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
  definition: LabwareDefinition2
  selectableWellClass?: string
  onMouseEnterWell?: (e: WellMouseEvent) => unknown
  onMouseLeaveWell?: (e: WellMouseEvent) => unknown
  hover?: boolean
  onLabwareClick?: () => void
  highlightLabware?: boolean
}

const TipDecoration = React.memo(function TipDecoration(props: {
  well: LabwareWell
}) {
  const { well } = props
  // @ts-expect-error(mc, 2021-04-27): refine well type before accessing `diameter`
  if (well.diameter) {
    // @ts-expect-error(mc, 2021-04-27): refine well type before accessing `diameter`
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
          hover={props.hover}
          highlight={props.highlightLabware === true}
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
