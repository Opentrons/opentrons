import * as React from 'react'
import { useSelector } from 'react-redux'
import { getUnocuppiedLabwareLocationOptions } from '../../../../top-selectors/labware-locations'
import { StepFormDropdown } from '../StepFormDropdownField'

export function LabwareLocationField(
  props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'>
): JSX.Element {
  const unoccupiedLabwareLocationsOptions =
    useSelector(getUnocuppiedLabwareLocationOptions) ?? []

  return (
    <StepFormDropdown {...props} options={unoccupiedLabwareLocationsOptions} />
  )
}
