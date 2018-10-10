// @flow
// Wrap Plate with a SelectionRect.
import * as React from 'react'
import map from 'lodash/map'
import {
  getWellDefsForSVG,
  getLabware,
  getIsTiprack,
} from '@opentrons/shared-data'
import {
  Labware,
  Well,
  Tip,
  LabwareOutline,
  LabwareLabels,
  ingredIdsToColor,
  type Channels,
} from '@opentrons/components'

import {WELL_LABEL_OFFSET} from '../constants'
import SingleLabware from '../components/SingleLabware'
import SelectionRect from '../components/SelectionRect.js'
import type {ContentsByWell} from '../labware-ingred/types'
import type {RectEvent} from '../collision-types'
import styles from './SelectablePlate.css'

type LabwareProps = React.ElementProps<typeof Labware>

export type Props = {
  wellContents: ContentsByWell,
  getTipProps?: $PropertyType<LabwareProps, 'getTipProps'>,
  containerType: string,

  selectable?: boolean,
  hoverable?: boolean,
  makeOnMouseOverWell?: (well: string) => (e: SyntheticMouseEvent<*>) => mixed,
  onMouseExitWell?: (e: SyntheticMouseEvent<*>) => mixed,

  onSelectionMove: RectEvent,
  onSelectionDone: RectEvent,

  // used by container
  containerId: string,
  pipetteChannels?: ?Channels,
}

// TODO: BC 2018-10-08 for disconnect hover and select in the IngredSelectionModal from
// redux, use SelectableLabware or similar component there. Also, where we are using this
// component in LabwareOnDeck, with no hover or select capabilities, pull out implicit highlighting
// labware into it's own component probably near to View Results' BrowsableLabware
export default function SelectablePlate (props: Props) {
  const {
    wellContents,
    getTipProps,
    containerType,
    onSelectionMove,
    onSelectionDone,
    selectable = false,
    hoverable = true,
    makeOnMouseOverWell,
    onMouseExitWell,
  } = props

  // NOTE: LabwareOnDeck is not selectable or hoverable
  if (!hoverable && !selectable) {
    const allWellDefsByName = getWellDefsForSVG(containerType)
    const isTiprack = getIsTiprack(containerType)
    const labwareDefinition = getLabware(containerType)

    const tipVolume = labwareDefinition && labwareDefinition.metadata && labwareDefinition.metadata.tipVolume

    return (
      <g>
        <LabwareOutline className={isTiprack ? styles.tiprack_plate_outline : null}/>
        {map(wellContents, (well, wellName) => {
          if (isTiprack) {
            const tipProps = (getTipProps && getTipProps(wellName)) || {}
            return (
              <Tip
                key={wellName}
                wellDef={allWellDefsByName[wellName]}
                tipVolume={tipVolume}
                {...tipProps}
              />
            )
          } else {
            return (
              <Well
                key={wellName}
                wellName={wellName}
                highlighted={well.highlighted}
                selected={well.selected}
                fillColor={ingredIdsToColor(well.groupIds)}
                svgOffset={{x: 1, y: -3}}
                wellDef={allWellDefsByName[wellName]} />
            )
          }
        })}
      </g>
    )
  } else { // NOTE: Currently only selectable and hoverable (bound to redux) in IngredientSelectionModal
    const getWellProps = (wellName) => {
      const well = wellContents[wellName]
      return {
        onMouseOver: makeOnMouseOverWell && makeOnMouseOverWell(wellName),
        onMouseLeave: onMouseExitWell,
        selectable,
        wellName,
        highlighted: well.highlighted,
        selected: well.selected,
        error: well.error,
        maxVolume: well.maxVolume,
        fillColor: ingredIdsToColor(well.groupIds),
      }
    }

    // FIXME: SelectionRect is somehow off by one in the x axis, hence the magic number
    return (
      <SingleLabware showLabels>
        <SelectionRect
          svg
          originXOffset={WELL_LABEL_OFFSET - 1}
          originYOffset={WELL_LABEL_OFFSET}
          {...{onSelectionMove, onSelectionDone}}>
          <Labware labwareType={containerType} getWellProps={getWellProps} getTipProps={getTipProps} />
          <LabwareLabels labwareType={containerType} />
        </SelectionRect>
      </SingleLabware>
    )
  }
}
