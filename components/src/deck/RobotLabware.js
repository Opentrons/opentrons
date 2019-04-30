// @flow
// Render labware definition to SVG. XY is in robot coordinates.
import * as React from 'react'
import flatMap from 'lodash/flatMap'
import cx from 'classnames'

import { LabwareOutline } from '@opentrons/components'
import styles from './robotLabware.css'

import type {
  LabwareDefinition2,
  LabwareParameters,
  LabwareOffset,
  LabwareWell,
} from '@opentrons/shared-data'

type Props = {
  definition: LabwareDefinition2,
}

type WellProps = {
  well: LabwareWell,
  parameters: LabwareParameters,
  cornerOffsetFromSlot: LabwareOffset,
}

export default function RobotLabware(props: Props) {
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

function Well(props: WellProps) {
  const { well, parameters, cornerOffsetFromSlot } = props
  const { isTiprack } = parameters

  // TODO(mc, 2019-04-04): cornerOffsetFromSlot is added to x and y because
  //   labware render is currently in slot coordinate system; revisit this
  //   decision when deck component refactor is in progress
  const x = well.x + cornerOffsetFromSlot.x
  const y = well.y + cornerOffsetFromSlot.y

  if (well.shape === 'circular') {
    const { diameter } = well
    const radius = diameter / 2
    // TODO(mc, 2019-03-27): figure out tip rendering; see:
    //   components/src/deck/Well.js
    //   components/src/deck/Tip.js
    return (
      <>
        <circle cx={x} cy={y} r={radius} />
        {isTiprack && <circle cx={x} cy={y} r={radius - 1} />}
      </>
    )
  }

  if (well.shape === 'rectangular') {
    const { length, width } = well
    return (
      <rect
        x={x - length / 2}
        y={y - width / 2}
        width={length}
        height={width}
      />
    )
  }

  console.warn('Invalid well', well)
  return null
}
