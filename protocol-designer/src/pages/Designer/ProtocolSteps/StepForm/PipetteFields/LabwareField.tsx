import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { getDisposalOptions } from '/protocol-designer/ui/labware/selectors'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import { useLabwareDropdownOptions } from '../../../utils'

import type { ReactNode } from 'react'
import type { FieldProps } from '../types'

export function LabwareField(props: FieldProps): ReactNode {
  const { name } = props
  const { i18n, t } = useTranslation(['protocol_steps', 'application'])
  const disposalOptions = useSelector(getDisposalOptions)
  const options = useLabwareDropdownOptions('labware', false)
  const dispatch = useDispatch()

  const allOptions =
    name === 'dispense_labware'
      ? [...options, ...disposalOptions]
      : [...options]

  return (
    <DropdownStepFormField
      {...props}
      name={name}
      options={allOptions}
      title={i18n.format(t(`${name}`), 'capitalize')}
      onEnter={(id: string) => {
        dispatch(hoverSelection({ id, text: t('application:select') }))
      }}
      onExit={() => {
        dispatch(hoverSelection({ id: null, text: null }))
      }}
      width="100%"
    />
  )
}
