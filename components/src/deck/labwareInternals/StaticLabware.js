// @flow
// Render labware definition to SVG. XY is in robot coordinates.
import * as React from 'react'
import flatMap from 'lodash/flatMap'
import cx from 'classnames'

import { LabwareOutline } from '@opentrons/components'
import Well from './Well'
import styles from './staticLabware.css'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

export type StaticLabwareProps = {|
  definition: LabwareDefinition2,
  selectableWellClass?: string,
  onMouseOverWell?: (wellName: string) => mixed,
|}

function StaticLabware(props: StaticLabwareProps) {
  const { parameters, ordering } = props.definition
  const { isTiprack } = parameters

  return (
    <g>
      <g className={styles.labware_detail_group}>
        <LabwareOutline
          className={cx({ [styles.tiprack_outline]: isTiprack })}
        />
      </g>
      <g>
        {flatMap(
          ordering,
          (row: Array<string>, i: number, c: Array<Array<string>>) => {
            return row.map(wellName => {
              return (
                <Well
                  key={wellName}
                  wellName={wellName}
                  definition={props.definition}
                  onMouseOverWell={props.onMouseOverWell}
                  selectableWellClass={props.selectableWellClass}
                />
              )
            })
          }
        )}
      </g>
    </g>
  )
}

export default React.memo<StaticLabwareProps>(StaticLabware)
