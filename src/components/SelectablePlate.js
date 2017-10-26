import React from 'react'
import Plate from './Plate.js'

import SelectionRect from '../components/SelectionRect.js'
import Well from '../components/Well.js'

const SelectablePlate = ({wellMatrix, onSelectionMove, onSelectionDone, containerId, selectable, ...otherProps}) => (
  // containerId not passed into Plate, so don't unpack into otherProps --------^
  <SelectionRect {...{onSelectionMove, onSelectionDone}}>
    <Plate
      selectable={selectable}
      Well={Well}
      wellMatrix={wellMatrix}
      {...otherProps}
    />
  </SelectionRect>
)

export default SelectablePlate
