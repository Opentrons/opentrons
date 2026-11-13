import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { DropdownStepFormField } from '/protocol-designer/components/molecules'
import { getEquippedPipetteOptions } from '/protocol-designer/step-forms/selectors'

import type { ReactNode } from 'react'
import type { FieldProps } from '../types'

export const PipetteField = (props: FieldProps): ReactNode => {
  const { value } = props
  const { t } = useTranslation('protocol_steps')
  const pipetteOptions = useSelector(getEquippedPipetteOptions)
  return (
    <DropdownStepFormField
      {...props}
      options={pipetteOptions}
      value={value ? String(value) : null}
      title={t('pipette')}
      width="100%"
    />
  )
}
