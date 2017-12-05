import React from 'react'
import Plate from './Plate.js'

import SelectionRect from '../components/SelectionRect.js'
// import HoverableWell from '../containers/HoverableWell.js' // DEPRECATED. TODO: delete once you steal styles in new SVG well

export default function SelectablePlate ({wellMatrix, containerType, onSelectionMove, onSelectionDone, containerId, selectable, ...otherProps}) {
  const plate = <Plate
    selectable={selectable}
    wellMatrix={wellMatrix}
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
