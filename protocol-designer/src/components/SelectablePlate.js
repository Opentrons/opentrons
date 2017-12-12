// Wrap Plate with a SelectionRect.
import React from 'react'
import { Plate } from '@opentrons/components'

import SelectionRect from '../components/SelectionRect.js'

export default function SelectablePlate ({
  wellContents,
  containerType,
  onSelectionMove,
  onSelectionDone,
  containerId,
  selectable,
  ...otherProps
}) {
  const plate = <Plate
    selectable={selectable}
    wellContents={wellContents}
    containerType={containerType}
    {...otherProps}
  />

  if (!selectable) return plate // don't wrap plate with SelectionRect

  return (
    <SelectionRect svg {...{onSelectionMove, onSelectionDone}}>
      {plate}
    </SelectionRect>
  )
}
