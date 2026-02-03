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
import type { PartialPrimaryNozzles } from '@opentrons/shared-data'
import type { AllTemporalPropertiesForTimelineFrame } from '/protocol-designer/step-forms'

export const partialNozzleMap: Record<PartialPrimaryNozzles, number> = {
  G1: 2,
  F1: 3,
  E1: 4,
  D1: 5,
  C1: 6,
  B1: 7,
}

export function getAvailableNozzleConfigurations(
  channels: number,
  deckSetup: AllTemporalPropertiesForTimelineFrame,
  t: TFunction
): DropdownOption[] {
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

export function getAvailablePrimaryNozzles(channels: number): DropdownOption[] {
  const primaryNozzleOptions: DropdownOption[] = [
    {
      name: 'A1',
      value: A1_NOZZLE,
    },
  ]

  if (channels === 96) {
    primaryNozzleOptions.push(
      ...[
        {
          name: 'A12',
          value: A12_NOZZLE,
        },
        {
          name: 'H1',
          value: H1_NOZZLE,
        },
        {
          name: 'H12',
          value: H12_NOZZLE,
        },
      ]
    )
  }
  if (channels === 8) {
    primaryNozzleOptions.push(
      ...[
        {
          name: 'H1',
          value: H1_NOZZLE,
        },
      ]
    )
  }

  return primaryNozzleOptions
}
