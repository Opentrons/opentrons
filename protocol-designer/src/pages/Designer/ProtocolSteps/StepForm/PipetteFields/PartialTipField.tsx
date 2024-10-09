import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { ALL, COLUMN } from '@opentrons/shared-data'
import { Flex, SPACING, DropdownMenu } from '@opentrons/components'
import { getInitialDeckSetup } from '../../../../../step-forms/selectors'
import type { FieldProps } from '../types'

export function PartialTipField(props: FieldProps): JSX.Element {
  const { value: dropdownItem, updateValue, errorToShow } = props
  const { t } = useTranslation('protocol_steps')
  const deckSetup = useSelector(getInitialDeckSetup)
  const tipracks = Object.values(deckSetup.labware).filter(
    labware => labware.def.parameters.isTiprack
  )
  const tipracksNotOnAdapter = tipracks.filter(
    tiprack => deckSetup.labware[tiprack.slot] == null
  )

  const options = [
    {
      name: 'all',
      value: ALL,
      tooltipText: t(`step_edit_form.field.nozzles.option_tooltip.ALL`),
    },
    {
      name: 'column',
      value: COLUMN,
      disabled: tipracksNotOnAdapter.length === 0,
      tooltipText: t(`step_edit_form.field.nozzles.option_tooltip.COLUMN`),
    },
  ]

  const [selectedValue, setSelectedValue] = useState(
    dropdownItem || options[0].value
  )
  useEffect(() => {
    updateValue(selectedValue)
  }, [selectedValue])

  return (
    <Flex padding={SPACING.spacing16}>
      <DropdownMenu
        width="17.5rem"
        error={errorToShow}
        dropdownType="neutral"
        filterOptions={options}
        title={t('select_nozzles')}
        currentOption={options[0]}
        onClick={value => {
          updateValue(value)
          setSelectedValue(value)
        }}
      />
    </Flex>
  )
}
