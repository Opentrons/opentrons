import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { DropdownMenu, Flex, SPACING } from '@opentrons/components'
import { ALL, COLUMN, ROW, SINGLE } from '@opentrons/shared-data'

import { getInitialDeckSetup } from '/protocol-designer/step-forms/selectors'

import type { DropdownOption } from '@opentrons/components'
import type { PipetteV2Specs } from '@opentrons/shared-data'
import type { FieldProps } from '../types'

interface PartialTipFieldProps extends FieldProps {
  pipetteSpecs: PipetteV2Specs
}
export function PartialTipField(props: PartialTipFieldProps): JSX.Element {
  const {
    value: dropdownItem,
    updateValue,
    errorToShow,
    padding = `0 ${SPACING.spacing16}`,
    tooltipContent,
    pipetteSpecs,
  } = props
  const { t } = useTranslation('protocol_steps')
  const deckSetup = useSelector(getInitialDeckSetup)
  const { channels } = pipetteSpecs

  const tipracks = Object.values(deckSetup.labware).filter(
    labware => labware.def.parameters.isTiprack
  )
  const tipracksNotOnAdapter = tipracks.filter(
    tiprack => tiprack.stack.length === 2
  )
  const areAllTipracksOnAdapter = tipracksNotOnAdapter.length === 0

  const options: DropdownOption[] = [
    {
      name: t('all_nozzles'),
      value: ALL,
    },
  ]
  if (channels === 96) {
    options.push(
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
          name: t('single_row_of_nozzles'),
          value: ROW,
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
  if (channels === 8) {
    // 8-channel
    options.push({
      name: t('single_nozzle'),
      value: SINGLE,
    })
  }

  const [selectedValue, setSelectedValue] = useState(
    dropdownItem || options[0].value
  )

  return (
    <Flex padding={padding}>
      <DropdownMenu
        width="100%"
        error={errorToShow}
        dropdownType="neutral"
        filterOptions={options}
        title={t('pipette_nozzles_and_wells')}
        currentOption={
          options.find(option => option.value === selectedValue) ?? options[0]
        }
        onClick={value => {
          updateValue(value)
          setSelectedValue(value)
        }}
        tooltipText={tooltipContent}
      />
    </Flex>
  )
}
