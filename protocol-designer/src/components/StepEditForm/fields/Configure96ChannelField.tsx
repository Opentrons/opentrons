import * as React from 'react'
import { useSelector } from 'react-redux'
import { ALL, COLUMN } from '@opentrons/shared-data'
import {
  FormGroup,
  SelectField,
  Tooltip,
  TOOLTIP_FIXED,
  useHoverTooltip,
} from '@opentrons/components'
import { i18n } from '../../../localization'
import { getInitialDeckSetup } from '../../../step-forms/selectors'
import { StepFormDropdown } from './StepFormDropdownField'
import styles from '../StepEditForm.css'

export function Configure96ChannelField(
  props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'>
): JSX.Element {
  const { value: dropdownItem, name, updateValue } = props
  const deckSetup = useSelector(getInitialDeckSetup)
  const tipracks = Object.values(deckSetup.labware).filter(
    labware => labware.def.parameters.isTiprack
  )
  const tipracksNotOnAdapter = tipracks.filter(
    tiprack => deckSetup.labware[tiprack.slot] == null
  )

  const options = [
    { name: 'all', value: ALL },
    {
      name: 'column',
      value: COLUMN,
      isDisabled: tipracksNotOnAdapter.length === 0,
    },
  ]

  const [selectedValue, setSelectedValue] = React.useState(
    dropdownItem || (options[0] && options[0].value)
  )
  React.useEffect(() => {
    updateValue(selectedValue)
  }, [selectedValue])

  return (
    <FormGroup
      label={i18n.t('form.step_edit_form.field.nozzles.label')}
      className={styles.small_field}
    >
      <SelectField
        options={options}
        name={name}
        value={dropdownItem ? String(dropdownItem) : options[0].value}
        onValueChange={(name, value) => {
          updateValue(value)
          setSelectedValue(value)
        }}
        formatOptionLabel={({ value, isDisabled }) => (
          <OptionLabel value={value} disabled={isDisabled} />
        )}
      />
    </FormGroup>
  )
}

interface LabelProps {
  value: string
  disabled?: boolean
}

const OptionLabel = (props: LabelProps): JSX.Element => {
  const { value, disabled } = props
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'bottom-start',
    strategy: TOOLTIP_FIXED,
  })
  return (
    <>
      <div {...targetProps}>
        {i18n.t(`form.step_edit_form.field.nozzles.option.${value}`)}
        {disabled ? (
          <Tooltip {...tooltipProps}>
            <div className={styles.tooltip}>
              {i18n.t(
                `form.step_edit_form.field.nozzles.option_tooltip.${value}`
              )}
            </div>
          </Tooltip>
        ) : null}
      </div>
    </>
  )
}
