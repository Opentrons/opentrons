import * as React from 'react'
import reduce from 'lodash/reduce'

import {
  COLORS,
  LabwareRender,
  RobotCoordinateSpace,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import {
  arrayToWellGroup,
  getCollidingWells,
  getWellSetForMultichannel,
} from './utils'
import { SelectionRect } from './SelectionRect'

import type { WellFill, WellGroup, WellStroke } from '@opentrons/components'
import type {
  LabwareDefinition2,
  PipetteChannels,
} from '@opentrons/shared-data'
import type { GenericRect } from './types'

interface WellSelectionProps {
  definition: LabwareDefinition2
  selectedPrimaryWells: WellGroup
  selectWells: (wellGroup: WellGroup) => unknown
  channels: PipetteChannels
}

export function WellSelection(props: WellSelectionProps): JSX.Element {
  const { definition, selectedPrimaryWells, selectWells, channels } = props

  const [highlightedWells, setHighlightedWells] = React.useState<WellGroup>({})

  const _wellsFromSelected: (
    selectedWells: WellGroup
  ) => WellGroup = selectedWells => {
    // Returns PRIMARY WELLS from the selection.
    if (channels === 8 || channels === 96) {
      // for the wells that have been highlighted,
      // get all 8-well well sets and merge them
      const primaryWells: WellGroup = reduce(
        selectedWells,
        (acc: WellGroup, _, wellName: string): WellGroup => {
          const wellSet = getWellSetForMultichannel(
            definition,
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

  const handleSelectionMove: (rect: GenericRect) => void = rect => {
    if (channels === 8 || channels === 96) {
      const selectedWells = _getWellsFromRect(rect)
      const allWellsForMulti: WellGroup = reduce(
        selectedWells,
        (acc: WellGroup, _, wellName: string): WellGroup => {
          const wellSetForMulti =
            getWellSetForMultichannel(definition, wellName, channels) || []
          const channelWells = arrayToWellGroup(wellSetForMulti)
          return {
            ...acc,
            ...channelWells,
          }
        },
        {}
      )
      setHighlightedWells(allWellsForMulti)
    } else {
      setHighlightedWells(_getWellsFromRect(rect))
    }
  }

  const handleSelectionDone: (rect: GenericRect) => void = rect => {
    const wells = _wellsFromSelected(_getWellsFromRect(rect))

    selectWells(wells)
    setHighlightedWells({})
  }

  // For rendering, show all wells not just primary wells
  const allSelectedWells =
    channels === 8 || channels === 96
      ? reduce<WellGroup, WellGroup>(
          selectedPrimaryWells,
          (acc, _, wellName): WellGroup => {
            const wellSet = getWellSetForMultichannel(
              definition,
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
  const wellStroke: WellStroke = {}
  Object.keys(definition.wells).forEach(wellName => {
    wellFill[wellName] = COLORS.blue35
    wellStroke[wellName] = COLORS.transparent
  })
  Object.keys(allSelectedWells).forEach(wellName => {
    wellFill[wellName] = COLORS.blue50
    wellStroke[wellName] = COLORS.transparent
  })
  Object.keys(highlightedWells).forEach(wellName => {
    wellFill[wellName] = COLORS.blue50
    wellStroke[wellName] = COLORS.transparent
  })

  return (
    <SelectionRect
      onSelectionMove={handleSelectionMove}
      onSelectionDone={handleSelectionDone}
    >
      <RobotCoordinateSpace viewBox="0 0 128 86">
        <LabwareRender
          definition={definition}
          hideOutline
          isInteractive
          wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_INSIDE}
          wellFill={wellFill}
          wellStroke={wellStroke}
        />
      </RobotCoordinateSpace>
    </SelectionRect>
  )
}
