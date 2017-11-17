import React from 'react'
import Plate from './Plate.js'

import SelectionRect from '../components/SelectionRect.js'
import HoverableWell from '../containers/HoverableWell.js'

export default function SelectablePlate ({wellMatrix, onSelectionMove, onSelectionDone, containerId, selectable, ...otherProps}) {
  return (
    // containerId not passed into Plate, so don't unpack into otherProps --------^
    <SelectionRect {...{onSelectionMove, onSelectionDone}}>
      <Plate
        selectable={selectable}
        Well={HoverableWell}
        wellMatrix={wellMatrix}
        {...otherProps}
      />
    </SelectionRect>
  )
}
