import React from 'react'
import Plate from './Plate.js'

// import SelectionRect from '../components/SelectionRect.js' // TODO bring back
import HoverableWell from '../containers/HoverableWell.js'

export default function SelectablePlate ({wellMatrix, containerType, onSelectionMove, onSelectionDone, containerId, selectable, ...otherProps}) {
  return (
    // containerId not passed into Plate, so don't unpack into otherProps --------^
    // TODO Ian 2017-12-04 bring back selection rect, SVG-compatible
    // <SelectionRect {...{onSelectionMove, onSelectionDone}}>
    <Plate
      selectable={selectable}
      Well={HoverableWell}
      wellMatrix={wellMatrix}
      containerType={containerType}
      {...otherProps}
    />
    // </SelectionRect>
  )
}
