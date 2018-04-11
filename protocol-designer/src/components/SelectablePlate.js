// @flow
// Wrap Plate with a SelectionRect.
import * as React from 'react'
import mapValues from 'lodash/mapValues'
import {swatchColors, Plate, type SingleWell} from '@opentrons/components'

import SelectionRect from '../components/SelectionRect.js'
import type {AllWellContents, WellContents} from '../labware-ingred/types'
import type {RectEvent} from '../collision-types'

export type Props = {
  wellContents: AllWellContents,
  containerType: string,
  onSelectionMove: RectEvent,
  onSelectionDone: RectEvent,
  containerId: string,
  selectable?: boolean
}

type PlateProps = React.ElementProps<typeof Plate>
type PlateWellContents = $PropertyType<PlateProps, 'wellContents'>
function wellContentsGroupIdsToColor (wc: AllWellContents): PlateWellContents {
  return mapValues(
    wc,
    (well: WellContents): SingleWell => ({
      wellName: well.wellName,
      selected: well.selected,
      preselected: well.preselected,
      highlighted: well.highlighted,
      maxVolume: well.maxVolume,

      fillColor: getFillColor(well.groupIds)
    })
  )
}

function getFillColor (groupIds: Array<string>): ?string {
  const FALLBACK_COLOR = 'gray'

  if (groupIds.length === 0) {
    return null
  }

  if (groupIds.length === 1) {
    return swatchColors(parseInt(groupIds[0]))
  }

  return FALLBACK_COLOR
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
    wellContents={wellContentsGroupIdsToColor(wellContents)}
    containerType={containerType}
    containerId={containerId}
    showLabels={selectable}
  />

  if (!selectable) return plate // don't wrap plate with SelectionRect

  return (
    <SelectionRect svg {...{onSelectionMove, onSelectionDone}}>
      {plate}
    </SelectionRect>
  )
}
