import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { useLabwareDropdownOptions } from '/protocol-designer/pages/Designer/utils'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import type { FieldProps } from '../../types'

interface MoveLabwareFieldProps extends FieldProps {
  useGripper: boolean
}
export function MoveLabwareField(props: MoveLabwareFieldProps): JSX.Element {
  const options = useLabwareDropdownOptions('moveLabware', props.useGripper)
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
