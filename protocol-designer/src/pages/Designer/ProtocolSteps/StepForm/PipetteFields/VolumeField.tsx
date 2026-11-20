import { useTranslation } from 'react-i18next'

import { InputStepFormField } from '/protocol-designer/components/molecules'

import type { ReactNode } from 'react'
import type { PathOption, StepType } from '/protocol-designer/form-types'
import type { FieldProps } from '../types'

interface VolumeFieldProps {
  fieldProps: FieldProps
  stepType: StepType
  path?: PathOption
}

export function VolumeField(props: VolumeFieldProps): ReactNode {
  const { t } = useTranslation(['protocol_steps', 'application'])
  const { fieldProps, stepType, path = 'single' } = props
  const isMixStep = stepType === 'mix'
  return (
    <InputStepFormField
      title={
        isMixStep
          ? t(`volume_per_well.${stepType}`)
          : t(`volume_per_well.${path}`)
      }
      units={t('application:units.microliter')}
      showTooltip={false}
      {...fieldProps}
    />
  )
}
