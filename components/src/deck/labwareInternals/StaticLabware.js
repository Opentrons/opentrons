// @flow
// Render labware definition to SVG. XY is in robot coordinates.
import assert from 'assert'
import * as React from 'react'
import flatMap from 'lodash/flatMap'
import cx from 'classnames'

import { LabwareOutline } from '@opentrons/components'
import Well from './Well'
import styles from './staticLabware.css'

import type { LabwareDefinition2, LabwareWell } from '@opentrons/shared-data'

export type StaticLabwareProps = {|
  definition: LabwareDefinition2,
  selectableWellClass?: string,
  onMouseOverWell?: (wellName: string) => mixed,
|}

const TipDecoration = React.memo(function TipDecoration(props: {
  well: LabwareWell,
}) {
  const { well } = props
  if (well.diameter) {
    const radius = well.diameter / 2
    return (
      <circle className={styles.tip} cx={well.x} cy={well.y} r={radius - 1} />
    )
  }
  assert(false, `TipDecoration expects a circular well with a diameter`)
  return null
})

function StaticLabware(props: StaticLabwareProps) {
  const { isTiprack } = props.definition.parameters

  return (
    <g>
      <g className={styles.labware_detail_group}>
        <LabwareOutline
          className={cx({ [styles.tiprack_outline]: isTiprack })}
        />
      </g>
      <g>
        {flatMap(
          props.definition.ordering,
          (row: Array<string>, i: number, c: Array<Array<string>>) => {
            return row.map(wellName => {
              return (
                <React.Fragment key={wellName}>
                  <Well
                    className={isTiprack ? styles.tip : null}
                    wellName={wellName}
                    well={props.definition.wells[wellName]}
                    onMouseOverWell={props.onMouseOverWell}
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

export default React.memo<StaticLabwareProps>(StaticLabware)
