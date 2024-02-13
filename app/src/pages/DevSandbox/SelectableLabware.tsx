import * as React from 'react'
import reduce from 'lodash/reduce'

import {
  WellMouseEvent,
  WellGroup,
  LabwareRender,
  RobotCoordinateSpace,
} from '@opentrons/components'
import { COLUMN } from '@opentrons/shared-data'
import {
  arrayToWellGroup,
  getCollidingWells,
  getWellSetForMultichannel,
} from './utils'
import { SelectionRect } from './SelectionRect'
import { GenericRect } from './types'

// import type { ContentsByWell } from '../../labware-ingred/types'
// import type { WellIngredientNames } from '../../steplist/types'
// import type { GenericRect } from '../../collision-types'
// import type { NozzleType } from '../../types'

export interface Props {
  labwareProps: Omit<
    React.ComponentProps<typeof LabwareRender>,
    'selectedWells'
  >
  /** array of primary wells. Overrides labwareProps.selectedWells */
  selectedPrimaryWells: WellGroup
  selectWells: (wellGroup: WellGroup) => unknown
  deselectWells: (wellGroup: WellGroup) => unknown
  updateHighlightedWells: (wellGroup: WellGroup) => unknown
  nozzleType: any
  ingredNames: any
  wellContents: any
}

type ChannelType = 8 | 96

const getChannelsFromNozleType = (nozzleType: any): ChannelType => {
  if (nozzleType === '8-channel' || nozzleType === COLUMN) {
    return 8
  } else {
    return 96
  }
}

export class SelectableLabware extends React.Component<Props> {
  _getWellsFromRect: (rect: GenericRect) => WellGroup = rect => {
    const selectedWells = getCollidingWells(rect)
    return this._wellsFromSelected(selectedWells)
  }

  _wellsFromSelected: (
    selectedWells: WellGroup
  ) => WellGroup = selectedWells => {
    const labwareDef = this.props.labwareProps.definition

    // Returns PRIMARY WELLS from the selection.
    if (this.props.nozzleType != null) {
      const channels = getChannelsFromNozleType(this.props.nozzleType)
      // for the wells that have been highlighted,
      // get all 8-well well sets and merge them
      const primaryWells: WellGroup = reduce(
        selectedWells,
        (acc: WellGroup, _, wellName: string): WellGroup => {
          const wellSet = getWellSetForMultichannel(
            labwareDef,
            wellName,
            channels
          )
          if (!wellSet) return acc
          return { ...acc, [wellSet[0]]: null }
        },
        {}
      )
      return primaryWells
    }

    // single-channel or ingred selection mode
    return selectedWells
  }

  handleSelectionMove: (e: TouchEvent, rect: GenericRect) => void = (
    e,
    rect
  ) => {
    const labwareDef = this.props.labwareProps.definition
    if (!e.shiftKey) {
      if (this.props.nozzleType != null) {
        const channels = getChannelsFromNozleType(this.props.nozzleType)
        const selectedWells = this._getWellsFromRect(rect)
        const allWellsForMulti: WellGroup = reduce(
          selectedWells,
          (acc: WellGroup, _, wellName: string): WellGroup => {
            const wellSetForMulti =
              getWellSetForMultichannel(labwareDef, wellName, channels) || []
            const channelWells = arrayToWellGroup(wellSetForMulti)
            return {
              ...acc,
              ...channelWells,
            }
          },
          {}
        )
        this.props.updateHighlightedWells(allWellsForMulti)
      } else {
        this.props.updateHighlightedWells(this._getWellsFromRect(rect))
      }
    }
  }

  handleSelectionDone: (e: TouchEvent, rect: GenericRect) => void = (
    e,
    rect
  ) => {
    const wells = this._wellsFromSelected(this._getWellsFromRect(rect))
    if (e.shiftKey) {
      this.props.deselectWells(wells)
    } else {
      this.props.selectWells(wells)
    }
  }

  handleMouseEnterWell: (args: WellMouseEvent) => void = args => {
    if (this.props.nozzleType != null) {
      const channels = getChannelsFromNozleType(this.props.nozzleType)
      const labwareDef = this.props.labwareProps.definition
      const wellSet = getWellSetForMultichannel(
        labwareDef,
        args.wellName,
        channels
      )
      const nextHighlightedWells = arrayToWellGroup(wellSet || [])
      nextHighlightedWells &&
        this.props.updateHighlightedWells(nextHighlightedWells)
    } else {
      this.props.updateHighlightedWells({ [args.wellName]: null })
    }
  }

  handleMouseLeaveWell: (args: WellMouseEvent) => void = args => {
    this.props.updateHighlightedWells({})
  }

  render(): React.ReactNode {
    const {
      labwareProps,
      wellContents,
      nozzleType,
      selectedPrimaryWells,
    } = this.props
    // For rendering, show all wells not just primary wells
    const allSelectedWells =
      nozzleType != null
        ? reduce<WellGroup, WellGroup>(
            selectedPrimaryWells,
            (acc, _, wellName): WellGroup => {
              const channels = getChannelsFromNozleType(nozzleType)
              const wellSet = getWellSetForMultichannel(
                this.props.labwareProps.definition,
                wellName,
                channels
              )
              if (!wellSet) return acc
              return { ...acc, ...arrayToWellGroup(wellSet) }
            },
            {}
          )
        : selectedPrimaryWells

    return (
      <SelectionRect
        onSelectionMove={this.handleSelectionMove}
        onSelectionDone={this.handleSelectionDone}
      >
        <RobotCoordinateSpace viewBox="0 0 147 86">
          <LabwareRender
            {...labwareProps}
            selectedWells={allSelectedWells}
            onMouseLeaveWell={mouseEventArgs => {
              this.handleMouseLeaveWell(mouseEventArgs)
            }}
            onMouseEnterWell={({ wellName, event }) => {
              if (wellContents !== null) {
                this.handleMouseEnterWell({ wellName, event })
              }
            }}
          />
        </RobotCoordinateSpace>
      </SelectionRect>
    )
  }
}
