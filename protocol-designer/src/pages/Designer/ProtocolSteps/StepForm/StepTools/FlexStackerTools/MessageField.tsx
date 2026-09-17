import { useTranslation } from 'react-i18next'

import { TextAreaField } from '@opentrons/components'

import type { ChangeEvent, ReactNode } from 'react'
import type { FieldProps } from '../../types'

export function MessageField(props: { fieldProps: FieldProps }): ReactNode {
  const { fieldProps } = props
  const { t } = useTranslation('form')
  return (
    <TextAreaField
      label={t('step_edit_form.flex_stacker.fields.interventionMessage.title')}
      {...fieldProps}
      value={fieldProps.value as string}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
        fieldProps.updateValue(e.currentTarget.value)
      }}
      height="7rem"
    />
  )
}
