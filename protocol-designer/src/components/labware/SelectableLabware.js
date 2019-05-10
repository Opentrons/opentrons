// @flow
import * as React from 'react'
import reduce from 'lodash/reduce'
import uniq from 'lodash/uniq'

import { getCollidingWells } from '../../utils'
import { SELECTABLE_WELL_CLASS } from '../../constants'
import { getWellSetForMultichannel } from '../../well-selection/utils'
import SingleLabware from './SingleLabware'
import SelectionRect from '../SelectionRect'
import WellTooltip from './WellTooltip'

import type { Channels, WellMouseEvent, WellArray } from '@opentrons/components'
import type { ContentsByWell } from '../../labware-ingred/types'
import type { WellIngredientNames } from '../../steplist/types'
import type { GenericRect } from '../../collision-types'

export type Props = {|
  labwareProps: $Diff<
    React.ElementProps<typeof SingleLabware>,
    { selectedWells: * }
  >,
  /** array of primary wells. Overrides labwareProps.selectedWells */
  selectedPrimaryWells: WellArray,
  selectWells: WellArray => mixed,
  deselectWells: WellArray => mixed,
  updateHighlightedWells: WellArray => mixed,
  pipetteChannels?: ?Channels,
  ingredNames: WellIngredientNames,
  wellContents: ContentsByWell,
|}

class SelectableLabware extends React.Component<Props> {
  _getWellsFromRect = (rect: GenericRect): * => {
    const selectedWells = getCollidingWells(rect, SELECTABLE_WELL_CLASS)
    return this._wellsFromSelected(selectedWells)
  }

  _wellsFromSelected = (selectedWells: WellArray): WellArray => {
    const labwareDef = this.props.labwareProps.definition
    // Returns PRIMARY WELLS from the selection.
    if (this.props.pipetteChannels === 8) {
      // for the wells that have been highlighted,
      // get all 8-well well sets and merge them
      const primaryWells: WellArray = selectedWells.reduce(
        (acc: WellArray, wellName: string): WellArray => {
          const wellSet = getWellSetForMultichannel(labwareDef, wellName)
          if (!wellSet) return acc
          return [...acc, wellSet[0]]
        },
        []
      )
      return primaryWells
    }

    // single-channel or ingred selection mode
    return selectedWells
  }

  handleSelectionMove = (e: MouseEvent, rect: GenericRect) => {
    const labwareDef = this.props.labwareProps.definition
    if (!e.shiftKey) {
      if (this.props.pipetteChannels === 8) {
        const selectedWells: WellArray = this._getWellsFromRect(rect)
        const allWellsForMulti: WellArray = selectedWells.reduce(
          (acc: WellArray, wellName: string): WellArray => {
            const wellSetForMulti =
              getWellSetForMultichannel(labwareDef, wellName) || []
            const channelWells: WellArray = wellSetForMulti.reduce(
              (acc, channelWellName: string) => [...acc, channelWellName],
              []
            )
            return [...acc, ...channelWells]
          },
          []
        )
        this.props.updateHighlightedWells(uniq(allWellsForMulti))
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

  handleMouseEnterWell = (args: WellMouseEvent) => {
    if (this.props.pipetteChannels === 8) {
      const labwareDef = this.props.labwareProps.definition
      const wellSet = getWellSetForMultichannel(labwareDef, args.wellName)
      const nextHighlightedWells = reduce(
        wellSet,
        (acc, wellName) => [...acc, wellName],
        []
      )
      nextHighlightedWells &&
        this.props.updateHighlightedWells(nextHighlightedWells)
    } else {
      this.props.updateHighlightedWells([args.wellName])
    }
  }

  handleMouseLeaveWell = (args: WellMouseEvent) => {
    this.props.updateHighlightedWells([])
  }

  render() {
    const {
      labwareProps,
      ingredNames,
      wellContents,
      pipetteChannels,
      selectedPrimaryWells,
    } = this.props

    // For rendering, show all wells not just primary wells
    const allSelectedWells =
      pipetteChannels === 8
        ? selectedPrimaryWells.reduce((acc, wellName) => {
            const wellSet = getWellSetForMultichannel(
              this.props.labwareProps.definition,
              wellName
            )
            if (!wellSet) return acc
            return [...acc, ...wellSet]
          }, [])
        : selectedPrimaryWells

    return (
      <SelectionRect
        // TODO IMMEDIATELY
        originXOffset={0}
        originYOffset={0}
        onSelectionMove={this.handleSelectionMove}
        onSelectionDone={this.handleSelectionDone}
      >
        <WellTooltip ingredNames={ingredNames}>
          {({
            makeHandleMouseEnterWell,
            handleMouseLeaveWell,
            tooltipWellName,
          }) => (
            <SingleLabware
              {...labwareProps}
              selectedWells={allSelectedWells}
              onMouseLeaveWell={mouseEventArgs => {
                this.handleMouseLeaveWell(mouseEventArgs)
                handleMouseLeaveWell(mouseEventArgs.event)
              }}
              selectableWellClass={SELECTABLE_WELL_CLASS}
              onMouseEnterWell={({ wellName, event }) => {
                this.handleMouseEnterWell({ wellName, event })
                makeHandleMouseEnterWell(
                  wellName,
                  wellContents[wellName].ingreds
                )(event)
              }}
            />
          )}
        </WellTooltip>
      </SelectionRect>
    )
  }
}

export default SelectableLabware
