// @flow
import * as React from 'react'
import reduce from 'lodash/reduce'
import map from 'lodash/map'
import {
  swatchColors,
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
import type {GenericRect} from '../../collision-types'

export type Props = {
  wellContents: ContentsByWell,
  containerType: string,
  selectedWells: Wells,
  highlightedWells: Wells,
  selectWells: (Wells) => mixed,
  deselectWells: (Wells) => mixed,
  updateHighlightedWells: (Wells) => mixed,
  pipetteChannels?: ?Channels,
}

// TODO Ian 2018-07-20: make sure '__air__' or other pseudo-ingredients don't get in here
function getFillColor (groupIds: Array<string>): ?string {
  if (groupIds.length === 0) return null
  if (groupIds.length === 1) return swatchColors(Number(groupIds[0]))
  return MIXED_WELL_COLOR
}

class SelectableLabware extends React.Component<Props> {
  _getWellsFromRect = (rect: GenericRect): * => (
    getCollidingWells(rect, SELECTABLE_WELL_CLASS)
  )

  _wellsFromSelected = (selectedWells: Wells): Wells => {
    // Returns PRIMARY WELLS from the selection.
    if (this.props.pipetteChannels === 8) {
      // for the wells that have been highlighted,
      // get all 8-well well sets and merge them
      const primaryWells: Wells = Object.keys(selectedWells).reduce((acc: Wells, well: string): Wells => {
        const wellSet = getWellSetForMultichannel(this.props.containerType, well)
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
        const selectedWells = this._getWellsFromRect(rect)
        const allWells: Wells = Object.keys(selectedWells).reduce((acc: Wells, well: string): Wells => {
          const channelWells: Array<string> = reduce(getWellSetForMultichannel(this.props.containerType, well), (acc, wellName) => ({
            ...acc,
            [wellName]: wellName,
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

  makeHandleMouseOverWell = (wellName: string) => () => {
    if (this.props.pipetteChannels === 8) {
      const wellSet = getWellSetForMultichannel(this.props.containerType, wellName)
      const nextHighlightedWells = reduce(wellSet, (acc, well) => ({...acc, [well]: well}), {})
      nextHighlightedWells && this.props.updateHighlightedWells(nextHighlightedWells)
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
      pipetteChannels,
    } = this.props

    const allWellDefsByName = getWellDefsForSVG(containerType)

    const selectedWellSets = pipetteChannels === 8
      ? reduce(selectedWells, (acc, wellName) => {
        const wellSet = getWellSetForMultichannel(this.props.containerType, wellName)
        if (!wellSet) return acc
        return [...acc, ...wellSet]
      }, [])
      : Object.keys(selectedWells)
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
              selected={selectedWellSets.includes(wellName)}
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
