import * as React from 'react'
import { useSelector } from 'react-redux'
import {
  getDisposalOptions,
  getLabwareOptions,
} from '../../../ui/labware/selectors'
import { StepFormDropdown } from './StepFormDropdownField'
import type { FieldProps } from '../types'

export const LabwareField = (props: FieldProps): JSX.Element => {
  const disposalOptions = useSelector(getDisposalOptions)
  const options = useSelector(getLabwareOptions)
  const allOptions =
    props.name === 'dispense_labware'
      ? [...options, ...disposalOptions]
      : [...options]

  return <StepFormDropdown {...props} options={allOptions} />
}
