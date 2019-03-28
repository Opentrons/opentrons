// @flow
// render labware definition to SVG
// TODO(mc, 2019-03-27): Move this component to components library for usage in
//   app and protocol-designer
import * as React from 'react'
import flatMap from 'lodash/flatMap'
import cx from 'classnames'

import {SLOT_RENDER_WIDTH, SLOT_RENDER_HEIGHT} from '@opentrons/shared-data'
import {LabwareOutline} from '@opentrons/components'
import styles from './styles.css'

import type {
  LabwareDefinition2 as LabwareDefinition,
  LabwareParameters,
  LabwareOffset,
  LabwareWell,
} from '@opentrons/shared-data'

export type LabwareRenderProps = {
  definition: LabwareDefinition,
}

export type LabwareWellRenderProps = {
  well: LabwareWell,
  parameters: LabwareParameters,
  cornerOffsetFromSlot: LabwareOffset,
}

export default function LabwareRender (props: LabwareRenderProps) {
  const {parameters, ordering, cornerOffsetFromSlot, wells} = props.definition
  const {isTiprack} = parameters

  // SVG coordinate system is flipped in Y from our definitions
  const transform = `translate(0,${SLOT_RENDER_HEIGHT}) scale(1,-1)`
  const viewBox = `0 0 ${SLOT_RENDER_WIDTH} ${SLOT_RENDER_HEIGHT}`

  return (
    <svg className={styles.labware_render} viewBox={viewBox}>
      <g className={styles.labware_detail_group}>
        <LabwareOutline className={cx({[styles.tiprack_outline]: isTiprack})} />
        {isTiprack && <TipRackOutline />}
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

// TODO(mc, 2019-03-28): Need UX guidance on this component
const TIPRACK_OUTLINE_X_OFFSET = 8
const TIPRACK_OUTLINE_Y_OFFSET = 5

function TipRackOutline () {
  return (
    <rect
      x={TIPRACK_OUTLINE_X_OFFSET}
      y={TIPRACK_OUTLINE_Y_OFFSET}
      width={SLOT_RENDER_WIDTH - 2 * TIPRACK_OUTLINE_X_OFFSET}
      height={SLOT_RENDER_HEIGHT - 2 * TIPRACK_OUTLINE_Y_OFFSET}
      rx="4px"
      ry="4px"
    />
  )
}

function Well (props: LabwareWellRenderProps) {
  const {well, parameters} = props
  const {x, y, shape, diameter, width, length} = well
  const {isTiprack} = parameters

  if (shape === 'circular' && diameter) {
    // TODO(mc, 2019-03-27): figure out tip rendering; see:
    //   components/src/deck/Well.js
    //   components/src/deck/Tip.js
    return (
      <>
        <circle cx={x} cy={y} r={diameter / 2} />
        {isTiprack && <circle cx={x} cy={y} r={(diameter - 2.5) / 2} />}
      </>
    )
  }

  if (shape === 'rectangular' && length && width) {
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
