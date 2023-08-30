import * as React from 'react'
import { useSelector } from 'react-redux'
import { i18n } from '../../../../localization'
import { getUnocuppiedLabwareLocationOptions } from '../../../../top-selectors/labware-locations'
import { StepFormDropdown } from '../StepFormDropdownField'

export function LabwareLocationField(
  props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'> & {
    useGripper: boolean
  } & { canSave: boolean } & { labware: string }
): JSX.Element {
  let unoccupiedLabwareLocationsOptions =
    useSelector(getUnocuppiedLabwareLocationOptions) ?? []

  if (props.useGripper) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => option.value !== 'offDeck'
    )
  }
  const bothFieldsSelected = props.labware != null && props.value != null

  return (
    <StepFormDropdown
      {...props}
      errorToShow={
        !props.canSave && bothFieldsSelected
          ? i18n.t(
              'form.step_edit_form.labwareLabel.errors.labwareSlotIncompatible'
            )
          : undefined
      }
      options={unoccupiedLabwareLocationsOptions}
    />
  )
}
