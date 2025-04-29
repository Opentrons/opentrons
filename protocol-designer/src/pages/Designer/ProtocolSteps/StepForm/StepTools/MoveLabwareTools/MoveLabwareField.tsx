import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { DropdownStepFormField } from '../../../../../../components/molecules'
import { hoverSelection } from '../../../../../../ui/steps/actions/actions'
import { useLabwareDropdownOptions } from '../../../../utils'

import type { FieldProps } from '../../types'

export function MoveLabwareField(props: FieldProps): JSX.Element {
  const options = useLabwareDropdownOptions('moveLabware')
  const dispatch = useDispatch()
  const { t } = useTranslation(['protocol_steps', 'application'])
  return (
    <DropdownStepFormField
      {...props}
      options={options}
      title={t('select_labware')}
      width="100%"
      onEnter={(id: string) => {
        dispatch(hoverSelection({ id, text: t('application:select') }))
      }}
      onExit={() => {
        dispatch(hoverSelection({ id: null, text: null }))
      }}
      tooltipContent={null}
    />
  )
}
