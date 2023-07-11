import * as React from 'react'
import { useSelector } from 'react-redux'
import { getUnocuppiedLabwareLocationOptions } from '../../../../top-selectors/labware-locations'
import { StepFormDropdown } from '../StepFormDropdownField'

export function LabwareLocationField(
  props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'> & {
    useGripper: boolean
  }
): JSX.Element {
  let unoccupiedLabwareLocationsOptions =
    useSelector(getUnocuppiedLabwareLocationOptions) ?? []

  if (props.useGripper) {
    unoccupiedLabwareLocationsOptions = unoccupiedLabwareLocationsOptions.filter(
      option => option.value !== 'offDeck'
    )
  }
  return (
    <StepFormDropdown {...props} options={unoccupiedLabwareLocationsOptions} />
  )
}
