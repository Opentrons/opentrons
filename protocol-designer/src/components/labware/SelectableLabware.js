// @flow
import * as React from 'react'
import reduce from 'lodash/reduce'
import map from 'lodash/map'
// import {connect} from 'react-redux'
import {
  swatchColors,
  Labware,
  LabwareLabels,
  MIXED_WELL_COLOR,
  type Channels,
  LabwareOutline,
  Well,
} from '@opentrons/components'

import {getWellDefsForSVG} from '@opentrons/shared-data'

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

        const selectedWellsFromSet = reduce(wellSet, (acc, well) => ({...acc, [well]: well}), {})
        return {...acc, ...selectedWellsFromSet}
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

  makeHandleMouseOverWell = (wellName) => () => {
    if (this.props.pipetteChannels === 8) {
      const wellSet = getWellSetForMultichannel(this.props.containerType, wellName)
      const nextHighlightedWells = reduce(wellSet, (acc, well) => ({...acc, [well]: well}), {})
      this.props.updateHighlightedWells(nextHighlightedWells)
    } else {
      this.props.updateHighlightedWells({[wellName]: wellName})
    }
  }

  handleMouseExitWell = () => {
    this.props.updateHighlightedWells({})
  }

  render () {
    const {
      wellContents,
      containerType,
      highlightedWells,
      selectedWells,
    } = this.props

    const allWellDefsByName = getWellDefsForSVG(containerType)

    return (
      <SelectionRect svg onSelectionMove={this.handleSelectionMove} onSelectionDone={this.handleSelectionDone}>
        <g>
          <LabwareOutline />
          {map(wellContents, (well, wellName) => (
            <Well
              selectable
              key={wellName}
              wellName={wellName}
              onMouseOver={this.makeHandleMouseOverWell(wellName)}
              onMouseLeave={this.handleMouseExitWell}
              highlighted={Object.keys(highlightedWells).includes(wellName)}
              selected={Object.keys(selectedWells).includes(wellName)}
              fillColor={getFillColor(well.groupIds)}
              svgOffset={{x: 1, y: -3}}
              wellDef={allWellDefsByName[wellName]} />
          ))}
        </g>
        <LabwareLabels labwareType={containerType} />
      </SelectionRect>
    )
  }
}

export default SelectableLabware
