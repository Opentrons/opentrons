// @flow
// Wrap Plate with a SelectionRect.
import React from 'react'
import { Plate } from '@opentrons/components'

import SelectionRect from '../components/SelectionRect.js'
import type {AllWellContents} from '../labware-ingred/types'

export type Props = {
  wellContents: AllWellContents,
  containerType: string,
  onSelectionMove: () => mixed, // TODO Ian 2018-03-08 type these 2 fns
  onSelectionDone: () => mixed,
  containerId: string,
  selectable: boolean
}

export default function SelectablePlate (props: Props) {
  const {
    wellContents,
    containerType,
    onSelectionMove,
    onSelectionDone,
    containerId,
    selectable
  } = props

  const plate = <Plate
    selectable={selectable}
    wellContents={wellContents}
    containerType={containerType}
    containerId={containerId}
  />

  if (!selectable) return plate // don't wrap plate with SelectionRect

  return (
    <SelectionRect svg {...{onSelectionMove, onSelectionDone}}>
      {plate}
    </SelectionRect>
  )
}
