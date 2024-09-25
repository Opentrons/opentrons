import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { getMoveLabwareOptions } from '../../../../../../ui/labware/selectors'
import { DropdownStepFormField } from '../../../../../../molecules'
import type { FieldProps } from '../../types'

export function MoveLabwareField(props: FieldProps): JSX.Element {
  const options = useSelector(getMoveLabwareOptions)
  const { t } = useTranslation('protocol_steps')
  return (
    <DropdownStepFormField
      {...props}
      options={options}
      title={t('select_labware')}
    />
  )
}
