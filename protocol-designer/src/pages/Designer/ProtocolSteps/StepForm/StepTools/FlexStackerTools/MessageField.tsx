import { useTranslation } from 'react-i18next'

import { TextAreaField } from '/protocol-designer/components/molecules/TextAreaField'

import type { ChangeEvent } from 'react'
import type { FieldProps } from '../../types'

export function MessageField(props: { fieldProps: FieldProps }): JSX.Element {
  const { fieldProps } = props
  const { t } = useTranslation('form')
  return (
    <TextAreaField
      title={t('step_edit_form.flex_stacker.fields.interventionMessage.title')}
      {...fieldProps}
      value={fieldProps.value as string}
      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
        fieldProps.updateValue(e.currentTarget.value)
      }}
      height="7rem"
    />
  )
}
