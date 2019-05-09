// @flow
import * as React from 'react'
import reduce from 'lodash/reduce'

import { getCollidingWells } from '../../utils'
import { SELECTABLE_WELL_CLASS, WELL_LABEL_OFFSET } from '../../constants'
import { getWellSetForMultichannel } from '../../well-selection/utils'
import SingleLabware from '../SingleLabware'
import SelectionRect from '../SelectionRect'
// import WellTooltip from './WellTooltip' // TODO IMMEDIATELY

import type { Channels, WellMouseEvent } from '@opentrons/components'
import type { WellSet } from '../../labware-ingred/types'
import type { GenericRect } from '../../collision-types'

export type Props = {
  labwareProps: React.ElementProps<typeof SingleLabware>,
  selectWells: WellSet => mixed,
  deselectWells: WellSet => mixed,
  updateHighlightedWells: WellSet => mixed,
  pipetteChannels?: ?Channels,
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
      const primaryWells: WellSet = Object.keys(selectedWells).reduce(
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
    const { labwareProps, pipetteChannels, updateHighlightedWells } = this.props
    const { definition, highlightedWells } = labwareProps

    // TODO IMMEDIATELY: should this be done in state???
    // const selectedWellSets =
    //   pipetteChannels === 8
    //     ? [...selectedWells].reduce((acc, wellName) => {
    //         const wellSet = getWellSetForMultichannel(definition, wellName)
    //         if (!wellSet) return acc
    //         return [...acc, ...wellSet]
    //       }, [])
    //     : selectedWells

    // map(wellContents, (well, wellName) => (
    //   <Well
    //     selectable
    //     key={wellName}
    //     wellName={wellName}
    //     onMouseOver={this.makeHandleMouseEnterWell(
    //       wellName,
    //       well.ingreds
    //         ? makeHandleMouseEnterWell(wellName, well.ingreds)
    //         : () => {}
    //     )}
    //     onMouseLeave={this.makeHandleMouseExitWell(
    //       handleMouseLeaveWell
    //     )}
    //     highlighted={Object.keys(highlightedWells).includes(
    //       wellName
    //     )}
    //     selected={selectedWellSets.includes(wellName)}
    //     fillColor={ingredIdsToColor(well.groupIds)}
    //     svgOffset={{ x: 1, y: -3 }}
    //     wellDef={allWellDefsByName[wellName]}
    //   />
    // ))

    // FIXME: SelectionRect is somehow off by one in the x axis, hence the magic number
    return (
      <SelectionRect
        originXOffset={WELL_LABEL_OFFSET - 1}
        originYOffset={WELL_LABEL_OFFSET}
        onSelectionMove={this.handleSelectionMove}
        onSelectionDone={this.handleSelectionDone}
      >
        {/* TODO IMMEDIATELY: make WellTooltip somehow less boilerplate-y and use here */}
        <SingleLabware
          {...labwareProps}
          onMouseEnterWell={this.handleMouseEnterWell}
          onMouseLeaveWell={this.handleMouseLeaveWell}
          selectableWellClass={SELECTABLE_WELL_CLASS}
        />
      </SelectionRect>
    )
  }
}

export default SelectableLabware
