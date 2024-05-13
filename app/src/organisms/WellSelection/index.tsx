import * as React from 'react'
import reduce from 'lodash/reduce'

import {
  COLORS,
  LabwareRender,
  RobotCoordinateSpace,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import { COLUMN } from '@opentrons/shared-data'
import {
  arrayToWellGroup,
  getCollidingWells,
  getWellSetForMultichannel,
} from './utils'
import { SelectionRect } from './SelectionRect'

import type { WellMouseEvent, WellFill, WellGroup } from '@opentrons/components'
import type { ContentsByWell, GenericRect, NozzleType } from './types'

interface WellSelectionProps {
  labwareProps: Omit<
    React.ComponentProps<typeof LabwareRender>,
    'selectedWells'
  >
  /** array of primary wells. Overrides labwareProps.selectedWells */
  selectedPrimaryWells: WellGroup
  selectWells: (wellGroup: WellGroup) => unknown
  deselectWells: (wellGroup: WellGroup) => unknown
  updateHighlightedWells: (wellGroup: WellGroup) => unknown
  nozzleType: NozzleType | null
  wellContents: ContentsByWell
}

type ChannelType = 8 | 96

const getChannelsFromNozzleType = (nozzleType: NozzleType): ChannelType => {
  if (nozzleType === '8-channel' || nozzleType === COLUMN) {
    return 8
  } else {
    return 96
  }
}

export function WellSelection(props: WellSelectionProps): JSX.Element {
  const {
    labwareProps,
    selectedPrimaryWells,
    selectWells,
    deselectWells,
    updateHighlightedWells,
    nozzleType,
    wellContents,
  } = props
  const labwareDef = labwareProps.definition

  const _wellsFromSelected: (
    selectedWells: WellGroup
  ) => WellGroup = selectedWells => {
    // Returns PRIMARY WELLS from the selection.
    if (nozzleType != null) {
      const channels = getChannelsFromNozzleType(nozzleType)
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

  const _getWellsFromRect: (rect: GenericRect) => WellGroup = rect => {
    const selectedWells = getCollidingWells(rect)
    return _wellsFromSelected(selectedWells)
  }

  const handleSelectionMove: (e: MouseEvent, rect: GenericRect) => void = (
    e,
    rect
  ) => {
    if (!e.shiftKey) {
      if (nozzleType != null) {
        const channels = getChannelsFromNozzleType(nozzleType)
        const selectedWells = _getWellsFromRect(rect)
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
        updateHighlightedWells(allWellsForMulti)
      } else {
        updateHighlightedWells(_getWellsFromRect(rect))
      }
    }
  }

  const handleSelectionDone: (e: MouseEvent, rect: GenericRect) => void = (
    e,
    rect
  ) => {
    const wells = _wellsFromSelected(_getWellsFromRect(rect))
    if (e.shiftKey) {
      deselectWells(wells)
    } else {
      selectWells(wells)
    }
  }

  const handleMouseEnterWell: (args: WellMouseEvent) => void = args => {
    if (nozzleType != null) {
      const channels = getChannelsFromNozzleType(nozzleType)
      const wellSet = getWellSetForMultichannel(
        labwareDef,
        args.wellName,
        channels
      )
      const nextHighlightedWells = arrayToWellGroup(wellSet || [])
      nextHighlightedWells && updateHighlightedWells(nextHighlightedWells)
    } else {
      updateHighlightedWells({ [args.wellName]: null })
    }
  }

  // For rendering, show all wells not just primary wells
  const allSelectedWells =
    nozzleType != null
      ? reduce<WellGroup, WellGroup>(
          selectedPrimaryWells,
          (acc, _, wellName): WellGroup => {
            const channels = getChannelsFromNozzleType(nozzleType)
            const wellSet = getWellSetForMultichannel(
              labwareDef,
              wellName,
              channels
            )
            if (!wellSet) return acc
            return { ...acc, ...arrayToWellGroup(wellSet) }
          },
          {}
        )
      : selectedPrimaryWells

  const wellFill: WellFill = {}
  Object.keys(labwareProps.definition.wells).forEach(wellName => {
    wellFill[wellName] = COLORS.blue35
  })
  Object.keys(allSelectedWells).forEach(wellName => {
    wellFill[wellName] = COLORS.blue50
  })

  return (
    <SelectionRect
      onSelectionMove={handleSelectionMove}
      onSelectionDone={handleSelectionDone}
    >
      <RobotCoordinateSpace viewBox="0 0 128 86">
        <LabwareRender
          {...labwareProps}
          selectedWells={allSelectedWells}
          onMouseLeaveWell={() => {
            updateHighlightedWells({})
          }}
          onMouseEnterWell={({ wellName, event }) => {
            if (wellContents !== null) {
              handleMouseEnterWell({ wellName, event })
            }
          }}
          hideOutline
          wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE}
          wellFill={wellFill}
        />
      </RobotCoordinateSpace>
    </SelectionRect>
  )
}
