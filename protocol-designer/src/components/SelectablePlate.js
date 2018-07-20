// @flow
// Wrap Plate with a SelectionRect.
import * as React from 'react'
import mapValues from 'lodash/mapValues'
import {
  swatchColors,
  Plate,
  MIXED_WELL_COLOR,
  type SingleWell,
  type Channels
} from '@opentrons/components'

import SelectionRect from '../components/SelectionRect.js'
import type {ContentsByWell, WellContents} from '../labware-ingred/types'
import type {RectEvent} from '../collision-types'

type PlateProps = React.ElementProps<typeof Plate>
type PlateWellContents = $PropertyType<PlateProps, 'wellContents'>

export type Props = {
  wellContents: ContentsByWell,
  containerType: $PropertyType<PlateProps, 'containerType'>,

  selectable?: $PropertyType<PlateProps, 'selectable'>,
  handleMouseOverWell?: $PropertyType<PlateProps, 'handleMouseOverWell'>,
  handleMouseExitWell?: $PropertyType<PlateProps, 'handleMouseExitWell'>,

  onSelectionMove: RectEvent,
  onSelectionDone: RectEvent,

  // used by container
  containerId: string,
  pipetteChannels?: Channels
}

function wellContentsGroupIdsToColor (wc: ContentsByWell): PlateWellContents {
  return mapValues(
    wc,
    (well: WellContents): SingleWell => ({
      wellName: well.wellName,

      highlighted: well.highlighted,
      selected: well.selected,
      error: well.error,
      maxVolume: well.maxVolume,

      fillColor: getFillColor(well.groupIds)
    })
  )
}

// TODO Ian 2018-07-20: make sure '__air__' or other pseudo-ingredients don't get in here
function getFillColor (groupIds: Array<string>): ?string {
  if (groupIds.length === 0) {
    return null
  }

  if (groupIds.length === 1) {
    return swatchColors(Number(groupIds[0]))
  }

  return MIXED_WELL_COLOR
}

export default function SelectablePlate (props: Props) {
  const {
    wellContents,
    containerType,
    onSelectionMove,
    onSelectionDone,
    selectable,
    handleMouseOverWell,
    handleMouseExitWell
  } = props

  const plate = <Plate
    {...{
      selectable,
      containerType,
      handleMouseOverWell,
      handleMouseExitWell
    }}
    showLabels={selectable}
    wellContents={wellContentsGroupIdsToColor(wellContents)}
  />

  if (!selectable) return plate // don't wrap plate with SelectionRect

  return (
    <SelectionRect svg {...{onSelectionMove, onSelectionDone}}>
      {plate}
    </SelectionRect>
  )
}
