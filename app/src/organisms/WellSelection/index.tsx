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

import type { WellFill, WellGroup, WellStroke } from '@opentrons/components'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { GenericRect, NozzleType } from './types'

interface WellSelectionProps {
  definition: LabwareDefinition2
  /** array of primary wells. Overrides labwareProps.selectedWells */
  selectedPrimaryWells: WellGroup
  selectWells: (wellGroup: WellGroup) => unknown
  nozzleType: NozzleType | null
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
  const { definition, selectedPrimaryWells, selectWells, nozzleType } = props

  const [highlightedWells, setHighlightedWells] = React.useState<WellGroup>({})

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
    if (nozzleType != null) {
      const channels = getChannelsFromNozzleType(nozzleType)
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
    nozzleType != null
      ? reduce<WellGroup, WellGroup>(
          selectedPrimaryWells,
          (acc, _, wellName): WellGroup => {
            const channels = getChannelsFromNozzleType(nozzleType)
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
