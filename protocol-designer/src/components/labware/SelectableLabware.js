// @flow
import * as React from 'react'
import reduce from 'lodash/reduce'
import map from 'lodash/map'
import {
  LabwareLabels,
  type Channels,
  LabwareOutline,
  Well,
  ingredIdsToColor,
} from '@opentrons/components'

import {getWellDefsForSVG} from '@opentrons/shared-data'

import {getCollidingWells} from '../../utils'
import {
  SELECTABLE_WELL_CLASS,
  WELL_LABEL_OFFSET,
} from '../../constants'
import {getWellSetForMultichannel} from '../../well-selection/utils'
import SelectionRect from '../SelectionRect.js'
import type {ContentsByWell, Wells} from '../../labware-ingred/types'
import type {WellIngredientNames} from '../../steplist/types'
import type {GenericRect} from '../../collision-types'
import WellTooltip from './WellTooltip'

export type Props = {
  wellContents: ContentsByWell,
  containerType: string,
  selectedWells: Wells,
  highlightedWells: Wells,
  selectWells: (Wells) => mixed,
  deselectWells: (Wells) => mixed,
  updateHighlightedWells: (Wells) => mixed,
  pipetteChannels?: ?Channels,
  ingredNames: WellIngredientNames,
}

class SelectableLabware extends React.Component<Props> {
  _getWellsFromRect = (rect: GenericRect): * => {
    const selectedWells = getCollidingWells(rect, SELECTABLE_WELL_CLASS)
    return this._wellsFromSelected(selectedWells)
  }

  _wellsFromSelected = (selectedWells: Wells): Wells => {
    // Returns PRIMARY WELLS from the selection.
    if (this.props.pipetteChannels === 8) {
      // for the wells that have been highlighted,
      // get all 8-well well sets and merge them
      const primaryWells: Wells = Object.keys(selectedWells).reduce((acc: Wells, wellName: string): Wells => {
        const wellSet = getWellSetForMultichannel(this.props.containerType, wellName)
        if (!wellSet) return acc

        return {...acc, [wellSet[0]]: wellSet[0]}
      }, {})

      return primaryWells
    }

    // single-channel or ingred selection mode
    return selectedWells
  }

  handleSelectionMove = (e: MouseEvent, rect: GenericRect) => {
    if (!e.shiftKey) {
      if (this.props.pipetteChannels === 8) {
        const selectedWells: Wells = this._getWellsFromRect(rect)
        const allWells: Wells = Object.keys(selectedWells).reduce((acc: Wells, wellName: string): Wells => {
          const channelWells: ?Wells = reduce(getWellSetForMultichannel(this.props.containerType, wellName), (acc, channelWellName) => ({
            ...acc,
            [channelWellName]: channelWellName,
          }), {})
          return {...acc, ...channelWells}
        }, {})
        this.props.updateHighlightedWells(allWells)
      } else {
        this.props.updateHighlightedWells(this._getWellsFromRect(rect))
      }
    }
  }
  handleSelectionDone = (e: MouseEvent, rect: GenericRect) => {
    const wells = this._wellsFromSelected(this._getWellsFromRect(rect))
    if (e.shiftKey) {
      this.props.deselectWells(wells)
    } else {
      this.props.selectWells(wells)
    }
  }

  makeHandleMouseOverWell = (wellName: string, callback: () => void) => () => {
    callback()
    if (this.props.pipetteChannels === 8) {
      const wellSet = getWellSetForMultichannel(this.props.containerType, wellName)
      const nextHighlightedWells = reduce(wellSet, (acc, well) => ({...acc, [well]: well}), {})
      nextHighlightedWells && this.props.updateHighlightedWells(nextHighlightedWells)
    } else {
      this.props.updateHighlightedWells({[wellName]: wellName})
    }
  }

  makeHandleMouseExitWell = (callback: () => void) => () => {
    callback()
    this.props.updateHighlightedWells({})
  }

  render () {
    const {
      wellContents,
      containerType,
      highlightedWells,
      selectedWells,
      pipetteChannels,
      ingredNames,
    } = this.props

    const allWellDefsByName = getWellDefsForSVG(containerType)

    const selectedWellSets = pipetteChannels === 8
      ? reduce(selectedWells, (acc, wellName) => {
        const wellSet = getWellSetForMultichannel(this.props.containerType, wellName)
        if (!wellSet) return acc
        return [...acc, ...wellSet]
      }, [])
      : Object.keys(selectedWells)

    // FIXME: SelectionRect is somehow off by one in the x axis, hence the magic number
    return (
      <SelectionRect
        svg
        originXOffset={WELL_LABEL_OFFSET - 1}
        originYOffset={WELL_LABEL_OFFSET}
        onSelectionMove={this.handleSelectionMove}
        onSelectionDone={this.handleSelectionDone}>
        <WellTooltip ingredNames={ingredNames}>
          {
            ({makeHandleMouseOverWell, handleMouseLeaveWell}) => (
              <React.Fragment>
                <g>
                  <LabwareOutline />
                  {map(wellContents, (well, wellName) => (
                    <Well
                      selectable
                      key={wellName}
                      wellName={wellName}
                      onMouseOver={this.makeHandleMouseOverWell(wellName, makeHandleMouseOverWell(wellName, well.ingreds))}
                      onMouseLeave={ this.makeHandleMouseExitWell(handleMouseLeaveWell)}
                      highlighted={Object.keys(highlightedWells).includes(wellName)}
                      selected={selectedWellSets.includes(wellName)}
                      fillColor={ingredIdsToColor(well.groupIds)}
                      svgOffset={{x: 1, y: -3}}
                      wellDef={allWellDefsByName[wellName]} />
                  ))}
                </g>
                <LabwareLabels labwareType={containerType} />
              </React.Fragment>
            )
          }
        </WellTooltip>
      </SelectionRect>
    )
  }
}

export default SelectableLabware
