// TODO IMMEDIATELY: replace with labwareInternals
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

type StaticLabwareProps = {
  definition: LabwareDefinition2,
  showLabels: boolean,
  missingTips?: Set<string>,
  highlightedWells?: Set<string>,
  /** CSS color to fill specified wells */
  wellFill?: { [wellName: string]: string },
  /** Optional callback, called with well name when that well is moused over */
  onMouseOverWell?: (wellName: string) => mixed,
  /** Special class which, together with 'data-wellname' on the well elements,
    allows drag-to-select behavior */
  selectableWellClass?: string,
}

export function StaticLabware(props: StaticLabwareProps) {
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

// TODO: Ian 2019-04-30 Disambiguate this from older Well in Well.js
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

export default function RobotLabware(props: Props) {
  const { definition } = props

  const exampleStyle = { stroke: 'red', fill: 'blue' }
  return (
    <g>
      <Well
        style={exampleStyle}
        well={definition.wells['A1']}
        parameters={definition.parameters}
        cornerOffsetFromSlot={definition.cornerOffsetFromSlot}
      />

      <StaticLabware definition={definition} />
    </g>
  )
}
