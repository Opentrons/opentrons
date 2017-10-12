import React from 'react'
import Plate from './Plate.js'

import SelectionRect from '../components/SelectionRect.js'
import Well from '../components/Well.js'

const SelectablePlate = ({wellMatrix, onSelectionMove, onSelectionDone}) => (
  <SelectionRect {...{onSelectionMove, onSelectionDone}}>
    <Plate
      wellMatrix={wellMatrix}
      Well={Well}
      showLabels
    />
  </SelectionRect>
)

export default SelectablePlate
