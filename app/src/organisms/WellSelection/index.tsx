import { useState } from 'react'
import reduce from 'lodash/reduce'

import { COLORS, Labware, RobotCoordinateSpace } from '@opentrons/components'
import {
  arrayToWellGroup,
  getCollidingWells,
  getWellSetForMultichannel,
} from './utils'
import { Selection384Wells } from './Selection384Wells'
import { SelectionRect } from './SelectionRect'

import type { WellFill, WellGroup, WellStroke } from '@opentrons/components'
import type {
  LabwareDefinition2,
  PipetteChannels,
} from '@opentrons/shared-data'
import type { GenericRect } from './types'

interface WellSelectionProps {
  definition: LabwareDefinition2
  deselectWells: (wells: string[]) => void
  /* A well from which to derive the well set.
   * If utilizing this component specifically in the context of a command, this should be the 'wellName'. */
  selectedPrimaryWell: string
  selectWells: (wellGroup: WellGroup) => unknown
  channels: PipetteChannels
}

export function WellSelection(props: WellSelectionProps): JSX.Element {
  const {
    definition,
    deselectWells,
    selectedPrimaryWell,
    selectWells,
    channels,
  } = props
  const [highlightedWells, setHighlightedWells] = useState<WellGroup>({})

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
          const wellSet = getWellSetForMultichannel({
            labwareDef: definition,
            wellName,
            channels,
          })
          if (!wellSet) {
            return acc
          }
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
            getWellSetForMultichannel({
              labwareDef: definition,
              wellName,
              channels,
            }) || []
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

  // For rendering, show all valid wells, not just primary wells
  const buildAllSelectedWells = (): WellGroup => {
    if (channels === 8 || channels === 96) {
      const wellSet = getWellSetForMultichannel({
        labwareDef: definition,
        wellName: selectedPrimaryWell,
        channels,
      })

      return wellSet != null ? arrayToWellGroup(wellSet) : {}
    } else {
      return { [selectedPrimaryWell]: null }
    }
  }

  const allSelectedWells = buildAllSelectedWells()

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

  const labwareRender = (
    <RobotCoordinateSpace viewBox="0 0 128 86">
      <Labware
        definition={definition}
        hideOutline
        isInteractive
        showLabels={true}
        wellFill={wellFill}
        wellStroke={wellStroke}
      />
    </RobotCoordinateSpace>
  )
  return definition.parameters.format === '384Standard' ? (
    <Selection384Wells
      allSelectedWells={allSelectedWells}
      channels={channels}
      definition={definition}
      deselectWells={deselectWells}
      labwareRender={labwareRender}
      selectWells={selectWells}
    />
  ) : (
    <SelectionRect
      onSelectionMove={handleSelectionMove}
      onSelectionDone={handleSelectionDone}
    >
      {labwareRender}
    </SelectionRect>
  )
}
