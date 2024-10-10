import { useSelector } from 'react-redux'
import { getMoveLabwareOptions } from '../../../ui/labware/selectors'
import { StepFormDropdown } from './StepFormDropdownField'
import type { FieldProps } from '../types'

export function MoveLabwareField(props: FieldProps): JSX.Element {
  const options = useSelector(getMoveLabwareOptions)
  return <StepFormDropdown {...props} options={options} />
}
