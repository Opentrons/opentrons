import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import {
  getDisposalOptions,
  getLabwareOptions,
} from '../../../../../ui/labware/selectors'
import { DropdownStepFormField } from '../../../../../molecules'
import type { FieldProps } from '../types'

export function LabwareField(props: FieldProps): JSX.Element {
  const { name } = props
  const { t } = useTranslation('protocol_steps')
  const disposalOptions = useSelector(getDisposalOptions)
  const options = useSelector(getLabwareOptions)
  const allOptions =
    name === 'dispense_labware'
      ? [...options, ...disposalOptions]
      : [...options]

  return (
    <DropdownStepFormField
      {...props}
      name={name}
      options={allOptions}
      title={t(`select_${name}`)}
    />
  )
}
