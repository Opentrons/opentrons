// @flow
// Render labware definition to SVG. XY is in robot coordinates.
import * as React from 'react'
import flatMap from 'lodash/flatMap'
import cx from 'classnames'

import { LabwareOutline } from '@opentrons/components'
import Well from './Well'
import styles from './staticLabware.css'

import type { LabwareDefinition2 } from '@opentrons/shared-data'

type Props = {
  definition: LabwareDefinition2,
}

export default function StaticLabware(props: Props) {
  const { parameters, ordering, cornerOffsetFromSlot, wells } = props.definition
  const { isTiprack } = parameters

  return (
    <g>
      <g className={styles.labware_detail_group}>
        <LabwareOutline
          className={cx({ [styles.tiprack_outline]: isTiprack })}
        />
      </g>
      <g className={styles.well_group}>
        {flatMap(
          ordering,
          // all arguments typed to stop Flow from complaining
          (row: Array<string>, i: number, c: Array<Array<string>>) => {
            return row.map(wellName => {
              return (
                <Well
                  key={wellName}
                  well={wells[wellName]}
                  parameters={parameters}
                  cornerOffsetFromSlot={cornerOffsetFromSlot}
                />
              )
            })
          }
        )}
      </g>
    </g>
  )
}
