// @flow
// render labware definition to SVG
// TODO(mc, 2019-03-27): Move this component to components library for usage in
//   app and protocol-designer
import * as React from 'react'
import flatMap from 'lodash/flatMap'
import cx from 'classnames'

import { SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT } from '@opentrons/shared-data'
import { LabwareOutline } from '@opentrons/components'
import styles from './styles.css'

import type {
  LabwareDefinition,
  LabwareParameters,
  LabwareOffset,
  LabwareWell,
} from '../../types'

export type LabwareRenderProps = {
  definition: LabwareDefinition,
}

export type LabwareWellRenderProps = {
  well: LabwareWell,
  parameters: LabwareParameters,
  cornerOffsetFromSlot: LabwareOffset,
}

export default function LabwareRender(props: LabwareRenderProps) {
  const { parameters, ordering, cornerOffsetFromSlot, wells } = props.definition
  const { isTiprack } = parameters

  // SVG coordinate system is flipped in Y from our definitions
  const transform = `translate(0,${SLOT_RENDER_HEIGHT}) scale(1,-1)`
  const viewBox = `0 0 ${SLOT_RENDER_WIDTH} ${SLOT_RENDER_HEIGHT}`

  return (
    <svg className={styles.labware_render} viewBox={viewBox}>
      <g className={styles.labware_detail_group}>
        <LabwareOutline
          className={cx({ [styles.tiprack_outline]: isTiprack })}
        />
      </g>
      <g className={styles.well_group} transform={transform}>
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
    </svg>
  )
}

function Well(props: LabwareWellRenderProps) {
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
