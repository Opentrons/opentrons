import React from 'react'
import Plate from './Plate.js'

import SelectionRect from '../components/SelectionRect.js'
import Well from '../components/Well.js'

const SelectablePlate = ({wellMatrix, onSelectionMove, onSelectionDone, cssFillParent}) => (
  <SelectionRect {...{onSelectionMove, onSelectionDone}}>
    <Plate
      wellMatrix={wellMatrix}
      Well={Well}
      cssFillParent={cssFillParent}
      showLabels
    />
  </SelectionRect>
)

export default SelectablePlate
