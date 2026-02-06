import {
  A1_NOZZLE,
  A12_NOZZLE,
  ALL,
  COLUMN,
  H1_NOZZLE,
  H12_NOZZLE,
  PARTIAL,
  ROW,
  SINGLE,
} from '@opentrons/shared-data'

import type { TFunction } from 'i18next'
import type { DropdownOption } from '@opentrons/components'
import type {
  LabwareDefinition,
  NozzleConfigurationStyle,
  PartialPrimaryNozzles,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

export const partialNozzleMap: Record<PartialPrimaryNozzles, number> = {
  G1: 2,
  F1: 3,
  E1: 4,
  D1: 5,
  C1: 6,
  B1: 7,
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
      ]
    )
  }
  if (channels !== 8) {
    nozzleConfigurationOptions.push({
      name: t('single_row_of_nozzles'),
      value: ROW,
      disabled: areAllTipracksOnAdapter,
      tooltipText: areAllTipracksOnAdapter
        ? t('form:step_edit_form.field.alozzles.option_tooltip.partial')
        : null,
    })
  }
  if (channels === 8) {
    // 8-channel
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
    8: { SINGLE: [A1_NOZZLE, H1_NOZZLE], ALL: [A1_NOZZLE] },
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

export function getEntireLabwareRowOrColumn(
  wellName: string,
  labwareDef: LabwareDefinition,
  nozzleConfiguration: NozzleConfigurationStyle
): string[] {
  const wellOrdering = labwareDef.ordering
  if (nozzleConfiguration === SINGLE) {
    return [wellName]
  }
  let columnIndex = -1
  let rowIndex = -1
  for (let c = 0; c < wellOrdering.length; c++) {
    const r = wellOrdering[c].indexOf(wellName)
    if (r !== -1) {
      columnIndex = c
      rowIndex = r
      break
    }
  }
  if (columnIndex === -1 || rowIndex === -1) {
    return []
  }
  if (nozzleConfiguration === COLUMN) {
    return wellOrdering[columnIndex]
  }
  if (nozzleConfiguration === ROW) {
    return wellOrdering.map(column => column[rowIndex])
  }
  return []
}
