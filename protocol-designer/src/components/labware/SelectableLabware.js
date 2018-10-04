// @flow
import * as React from 'react'
// import mapValues from 'lodash/mapValues'
// import {connect} from 'react-redux'
import {
  swatchColors,
  Labware,
  LabwareLabels,
  MIXED_WELL_COLOR,
  type Channels,
} from '@opentrons/components'

import {getCollidingWells} from '../../utils'
import {SELECTABLE_WELL_CLASS} from '../../constants'
import {getWellSetForMultichannel} from '../../well-selection/utils'
import SelectionRect from '../SelectionRect.js'
import type {ContentsByWell, Wells} from '../../labware-ingred/types'

// import * as wellContentsSelectors from '../../top-selectors/well-contents'
// import wellSelectionSelectors from '../../well-selection/selectors'
// import {selectors} from '../../labware-ingred/reducers'
// import {selectors as steplistSelectors} from '../../steplist'
import type {GenericRect} from '../../collision-types'
// import type {BaseState} from '../../types'

type LabwareProps = React.ElementProps<typeof Labware>

export type Props = {
  wellContents: ContentsByWell,
  getTipProps?: $PropertyType<LabwareProps, 'getTipProps'>,
  containerType: string,
  updateSelectedWells: (Wells) => mixed,

  // used by container
  containerId: string,
  pipetteChannels?: ?Channels,
}

// TODO Ian 2018-07-20: make sure '__air__' or other pseudo-ingredients don't get in here
function getFillColor (groupIds: Array<string>): ?string {
  if (groupIds.length === 0) return null
  if (groupIds.length === 1) return swatchColors(Number(groupIds[0]))
  return MIXED_WELL_COLOR
}

class SelectableLabware extends React.Component<Props, State> {
  _getWellsFromRect = (rect: GenericRect): * => {
    const selectedWells = getCollidingWells(rect, SELECTABLE_WELL_CLASS)
    return this._wellsFromSelected(selectedWells)
  }

  _wellsFromSelected = (selectedWells: Wells): Wells => {
    // Returns PRIMARY WELLS from the selection.
    if (this.props.pipetteChannels === 8) {
      // for the wells that have been highlighted,
      // get all 8-well well sets and merge them
      const primaryWells: Wells = Object.keys(selectedWells).reduce((acc: Wells, well: string): Wells => {
        const wellSet = getWellSetForMultichannel(this.props.containerType, well)
        if (!wellSet) return acc

        const primaryWell = wellSet[0]

        return { ...acc, [primaryWell]: primaryWell }
      }, {})

      return primaryWells
    }

    // single-channel or ingred selection mode
    return selectedWells
  }

  handleSelectionMove = (e, rect) => {
    if (!e.shiftKey) {
      this.props.updateHighlightedWells(this._getWellsFromRect(rect))
    }
  }
  handleSelectionDone = (e, rect) => {
    const wells = this._getWellsFromRect(rect)
    if (e.shiftKey) {
      this.props.deselectWells(wells)
    } else {
      this.props.selectWells(wells)
    }
  }

  render () {
    const {
      wellContents,
      getTipProps,
      containerType,
      highlightedWells,
      selectedWells,
    } = this.props

    const getWellProps = (wellName) => {
      const well = wellContents[wellName]

      return {
        selectable: true,
        wellName,
        highlighted: Object.keys(highlightedWells).includes(wellName),
        selected: Object.keys(selectedWells).includes(wellName),
        error: well && well.error,
        maxVolume: well && well.maxVolume,
        fillColor: getFillColor(well.groupIds),
      }
    }

    return (
      <SelectionRect svg onSelectionMove={this.handleSelectionMove} onSelectionDone={this.handleSelectionDone}>
        <Labware labwareType={containerType} getWellProps={getWellProps} getTipProps={getTipProps} />
        <LabwareLabels labwareType={containerType} />
      </SelectionRect>
    )
  }
}

export default SelectableLabware
