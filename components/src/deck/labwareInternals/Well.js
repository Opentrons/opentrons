// @flow
import * as React from 'react'

import type {
  LabwareParameters,
  LabwareOffset,
  LabwareWell,
} from '@opentrons/shared-data'

type WellProps = {
  well: LabwareWell,
  parameters: LabwareParameters,
  cornerOffsetFromSlot: LabwareOffset,
}

export default function Well(props: WellProps) {
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
