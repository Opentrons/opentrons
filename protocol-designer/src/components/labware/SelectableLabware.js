// @flow
import * as React from 'react'
import reduce from 'lodash/reduce'

import { getCollidingWells } from '../../utils'
import { SELECTABLE_WELL_CLASS, WELL_LABEL_OFFSET } from '../../constants'
import { getWellSetForMultichannel } from '../../well-selection/utils'
import SingleLabware from './SingleLabware'
import SelectionRect from '../SelectionRect'
import WellTooltip from './WellTooltip'

import type { Channels, WellMouseEvent } from '@opentrons/components'
import type { ContentsByWell, WellSet } from '../../labware-ingred/types'
import type { WellIngredientNames } from '../../steplist/types'
import type { GenericRect } from '../../collision-types'

export type Props = {
  labwareProps: React.ElementProps<typeof SingleLabware>,
  selectWells: WellSet => mixed,
  deselectWells: WellSet => mixed,
  updateHighlightedWells: WellSet => mixed,
  pipetteChannels?: ?Channels,
  ingredNames: WellIngredientNames,
  wellContents: ContentsByWell,
}

class SelectableLabware extends React.Component<Props> {
  _getWellsFromRect = (rect: GenericRect): * => {
    const selectedWells = getCollidingWells(rect, SELECTABLE_WELL_CLASS)
    return this._wellsFromSelected(selectedWells)
  }

  _wellsFromSelected = (selectedWells: WellSet): WellSet => {
    const labwareDef = this.props.labwareProps.definition
    // Returns PRIMARY WELLS from the selection.
    if (this.props.pipetteChannels === 8) {
      // for the wells that have been highlighted,
      // get all 8-well well sets and merge them
      const primaryWells: WellSet = [...selectedWells].reduce(
        (acc: WellSet, wellName: string): WellSet => {
          const wellSet = getWellSetForMultichannel(labwareDef, wellName)
          if (!wellSet) return acc
          return new Set([...acc, wellSet[0]])
        },
        new Set()
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
        const selectedWells: WellSet = this._getWellsFromRect(rect)
        const allWellsForMulti: WellSet = [...selectedWells].reduce(
          (acc: WellSet, wellName: string): WellSet => {
            const wellSetForMulti =
              getWellSetForMultichannel(labwareDef, wellName) || []
            const channelWells: WellSet = wellSetForMulti.reduce(
              (acc, channelWellName: string) =>
                new Set([...acc, channelWellName]),
              new Set()
            )
            return new Set([...acc, ...channelWells])
          },
          new Set()
        )
        this.props.updateHighlightedWells(allWellsForMulti)
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
        (acc, wellName) => new Set([...acc, wellName]),
        new Set()
      )
      nextHighlightedWells &&
        this.props.updateHighlightedWells(nextHighlightedWells)
    } else {
      this.props.updateHighlightedWells(new Set([args.wellName]))
    }
  }

  handleMouseLeaveWell = (args: WellMouseEvent) => {
    this.props.updateHighlightedWells(new Set())
  }

  render() {
    const {
      labwareProps,
      ingredNames,
      wellContents,
      pipetteChannels,
    } = this.props

    // TODO IMMEDIATELY should this distinction be made upstream?
    const selectedPrimaryWells = labwareProps.selectedWells || new Set()

    // For rendering, show all wells not just primary wells
    const allSelectedWells =
      pipetteChannels === 8
        ? new Set(
            [...selectedPrimaryWells].reduce((acc, wellName) => {
              const wellSet = getWellSetForMultichannel(
                this.props.labwareProps.definition,
                wellName
              )
              if (!wellSet) return acc
              return [...acc, ...wellSet]
            }, [])
          )
        : selectedPrimaryWells

    // FIXME: SelectionRect is somehow off by one in the x axis, hence the magic number
    return (
      <SelectionRect
        originXOffset={WELL_LABEL_OFFSET - 1}
        originYOffset={WELL_LABEL_OFFSET}
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
