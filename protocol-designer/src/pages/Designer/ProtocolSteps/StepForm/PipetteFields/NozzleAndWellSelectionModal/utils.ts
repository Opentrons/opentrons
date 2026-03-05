import { INACCESSIBLE } from '@opentrons/components'
import {
  A1_NOZZLE,
  A12_NOZZLE,
  ALL,
  B1_NOZZLE,
  C1_NOZZLE,
  COLUMN,
  D1_NOZZLE,
  E1_NOZZLE,
  F1_NOZZLE,
  G1_NOZZLE,
  H1_NOZZLE,
  H12_NOZZLE,
  PARTIAL,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'

import { PARTIAL_NOZZLE_MAP } from './constants'

import type { TFunction } from 'i18next'
import type { DropdownOption, WellType } from '@opentrons/components'
import type {
  NozzleConfigurationStyle,
  PartialPrimaryNozzles,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

function isPartialPrimaryNozzle(
  nozzle: string
): nozzle is PartialPrimaryNozzles {
  return nozzle in PARTIAL_NOZZLE_MAP
}

export const getAvailableNozzleConfigurations = (
  channels: number,
  deckSetup: AllTemporalPropertiesForTimelineFrame,
  t: TFunction
): DropdownOption[] => {
  const tipracks = Object.values(deckSetup.labware).filter(
    labware => labware.def.parameters.isTiprack
  )
  const tipracksNotOnAdapter = tipracks.filter(
    tiprack => tiprack.stack.length === 2
  )
  const areAllTipracksOnAdapter = tipracksNotOnAdapter.length === 0

  const nozzleConfigurationOptions: DropdownOption[] = [
    {
      name: t('all_nozzles'),
      value: ALL,
    },
  ]
  if (channels === 96) {
    nozzleConfigurationOptions.push(
      ...[
        {
          name: t('single_nozzle'),
          value: SINGLE,
          disabled: areAllTipracksOnAdapter,
          tooltipText: areAllTipracksOnAdapter
            ? t('form:step_edit_form.field.nozzles.option_tooltip.partial')
            : null,
        },
        {
          name: t('single_column_of_nozzles'),
          value: COLUMN,
          disabled: areAllTipracksOnAdapter,
          tooltipText: areAllTipracksOnAdapter
            ? t('form:step_edit_form.field.nozzles.option_tooltip.partial')
            : null,
        },
        {
          name: t('single_row_of_nozzles'),
          value: ROW,
          disabled: areAllTipracksOnAdapter,
          tooltipText: areAllTipracksOnAdapter
            ? t('form:step_edit_form.field.alozzles.option_tooltip.partial')
            : null,
        },
      ]
    )
  }
  if (channels === 8) {
    nozzleConfigurationOptions.push({
      name: t('single_nozzle'),
      value: SINGLE,
    })
    nozzleConfigurationOptions.push({
      name: t('partial_nozzles'),
      value: PARTIAL,
    })
  }
  return nozzleConfigurationOptions
}

export const getAvailablePrimaryNozzles = (
  channels: number,
  nozzleConfiguration: string
): DropdownOption[] => {
  const allowedNozzlesMapping: Record<
    number,
    Record<string, PrimaryNozzleConfigurationStyle[]>
  > = {
    96: {
      SINGLE: [A1_NOZZLE, A12_NOZZLE, H1_NOZZLE, H12_NOZZLE],
      ROW: [A1_NOZZLE, H1_NOZZLE],
      COLUMN: [A1_NOZZLE, A12_NOZZLE],
      ALL: [A1_NOZZLE],
    },
    8: {
      SINGLE: [A1_NOZZLE, H1_NOZZLE],
      ALL: [A1_NOZZLE],
      PARTIAL: [
        B1_NOZZLE,
        C1_NOZZLE,
        D1_NOZZLE,
        E1_NOZZLE,
        G1_NOZZLE,
        F1_NOZZLE,
      ],
    },
    1: { ALL: [A1_NOZZLE] },
  }
  const filteredAllowedNozzles =
    allowedNozzlesMapping[channels][nozzleConfiguration]
  const primaryNozzleOptions = Object.entries(filteredAllowedNozzles).map(
    ([, primaryNozzle]) => ({
      name: primaryNozzle,
      value: primaryNozzle as PrimaryNozzleConfigurationStyle,
    })
  )
  return primaryNozzleOptions
}

export const getNozzleText = (
  primaryNozzle: PrimaryNozzleConfigurationStyle | null,
  nozzleConfiguration: NozzleConfigurationStyle,
  partialNozzleCount?: number
): string | null => {
  const nozzleTextMapping: Record<
    NozzleConfigurationStyle,
    (primary: PrimaryNozzleConfigurationStyle | null) => string | null
  > = {
    ALL: () => 'All',
    PARTIAL: () =>
      partialNozzleCount != null ? `${partialNozzleCount} nozzles` : null,

    SINGLE: primary => (primary ? `${primary} nozzle` : null),

    ROW: primary => (primary === A1_NOZZLE ? 'Top ' : 'Bottom '),

    COLUMN: primary => (primary === A1_NOZZLE ? 'Left ' : 'Right '),
    QUADRANT: () => null,
  }

  return nozzleTextMapping[nozzleConfiguration](primaryNozzle) ?? null
}

export const getEntireWellSelection = (
  wellName: string,
  wellOrdering: string[][],
  nozzleConfiguration: NozzleConfigurationStyle,
  primaryNozzle: PrimaryNozzleConfigurationStyle,
  channels: number
): string[] => {
  if (nozzleConfiguration === SINGLE) return [wellName]
  const columnIndex = wellOrdering.findIndex(column =>
    column.includes(wellName)
  )
  if (columnIndex === -1) return []
  const rowIndex = wellOrdering[columnIndex].indexOf(wellName)
  switch (nozzleConfiguration) {
    case ALL:
      if (channels === 8) {
        return wellOrdering[columnIndex]
      }
      if (channels === 96) {
        return wellOrdering.flat()
      }
      return [wellName]
    case COLUMN:
      return wellOrdering[columnIndex]
    case ROW:
      return wellOrdering.map(column => column[rowIndex])
    case PARTIAL: {
      if (!isPartialPrimaryNozzle(primaryNozzle)) {
        return []
      }

      const column = wellOrdering[columnIndex]
      const count = PARTIAL_NOZZLE_MAP[primaryNozzle]
      const remainingWells = column.length - rowIndex
      const isSingleRowLabware = column.length === 1
      if (!isSingleRowLabware && remainingWells < count) {
        const beginning = column.length - count
        return column.slice(beginning, column.length)
      }
      const end = rowIndex + count
      return column.slice(rowIndex, Math.min(end, column.length))
    }
    default:
      return [wellName]
  }
}

export const getInaccessibleWellsForPartialNozzleRowMap = (
  selectedWells: string[][],
  wellDefMap: string[][],
  allWellsWithState: Record<string, WellType>,
  channels: number
): string[] => {
  const inaccessible: string[] = []
  const selectedFlat = selectedWells.flat()

  for (const column of wellDefMap) {
    // Find indices of selected wells within the column
    const selectedIndices = selectedFlat
      .map(well => column.indexOf(well))
      .filter(index => index !== -1)
    if (selectedIndices.length === 0) {
      continue
    }
    // Split column into chunks of unselected wells around selected wells
    const boundaries = [-1, ...selectedIndices, column.length] // include start/end
    for (let i = 0; i < boundaries.length - 1; i++) {
      const start = boundaries[i] + 1 // add one to get the next boundary
      const end = boundaries[i + 1] // add one to the index to see where there is an index missing
      const chunk = column
        .slice(start, end)
        .filter(well => allWellsWithState[well] !== INACCESSIBLE)
      // Only mark inaccessible if chunk is smaller than channels
      if (chunk.length > 0 && chunk.length < channels) {
        chunk.forEach(well => {
          if (!inaccessible.includes(well)) inaccessible.push(well)
        })
      }
    }
  }

  return inaccessible
}

export function getWellGroupLength(
  totalSelected: number,
  ordering: string[][],
  nozzleConfiguration: NozzleConfigurationStyle,
  partialChannels: number
): number {
  switch (nozzleConfiguration) {
    case ROW:
    case COLUMN:
      return totalSelected
    case PARTIAL:
      if (ordering.length === 1) {
        return totalSelected
      }
      return totalSelected * partialChannels
    default:
      return totalSelected / 1
  }
}
