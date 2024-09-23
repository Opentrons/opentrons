import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { InputStepFormField } from '../../../../../molecules'

import type { FieldProps } from '../types'

export const VolumeField = (props: FieldProps): JSX.Element => {
  const { t } = useTranslation(['protocol_steps', 'application'])

  return (
    <InputStepFormField
      title={t('select_volume')}
      units={t('application:units.microliter')}
      {...props}
    />
  )
}
