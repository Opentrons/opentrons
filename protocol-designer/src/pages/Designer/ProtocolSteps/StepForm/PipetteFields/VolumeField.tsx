import { useTranslation } from 'react-i18next'

import { InputStepFormField } from '/protocol-designer/components/molecules'

import type { PathOption } from '/protocol-designer/form-types'
import type { FieldProps } from '../types'

interface VolumeFieldProps {
  fieldProps: FieldProps
  path?: PathOption
}

export function VolumeField(props: VolumeFieldProps): JSX.Element {
  const { t } = useTranslation(['protocol_steps', 'application'])
  const { fieldProps, path = 'single' } = props

  return (
    <InputStepFormField
      title={t(`volume_per_well.${path}`)}
      units={t('application:units.microliter')}
      showTooltip={false}
      {...fieldProps}
    />
  )
}
