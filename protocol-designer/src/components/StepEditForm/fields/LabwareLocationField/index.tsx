import * as React from 'react'
import { useSelector } from 'react-redux'
import { getUnocuppiedLabwareLocations } from '../../../../top-selectors/labware-locations'
import { StepFormDropdown } from '../StepFormDropdownField'

export function LabwareLocationField(props: Omit<React.ComponentProps<typeof StepFormDropdown>, 'options'>): JSX.Element {
  const unoccupiedLabwareLocations = useSelector(getUnocuppiedLabwareLocations) ?? []
  console.log('unoccupiedLabwareLocations', unoccupiedLabwareLocations)
  return (
    <StepFormDropdown
    {...props}
    options={unoccupiedLabwareLocations.map(loc => ({name: loc, value: loc}))} />
  )
}

