// @flow
// Wrap Plate with a SelectionRect.
import React from 'react'
import { Plate } from '@opentrons/components'

import SelectionRect from '../components/SelectionRect.js'

type Props = {
  wellContents: *, // WellContents,
  containerType: string,
  onSelectionMove: *,
  onSelectionDone: *,
  containerId: string,
  selectable: boolean
  // ...otherProps
}

export default function SelectablePlate (props: Props) {
  const {
    wellContents,
    containerType,
    onSelectionMove,
    onSelectionDone,
    containerId,
    selectable,
    ...otherProps
  } = props

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
