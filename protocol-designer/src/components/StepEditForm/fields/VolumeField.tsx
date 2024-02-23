import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  FormGroup,
  Tooltip,
  useHoverTooltip,
  TOOLTIP_TOP,
  TOOLTIP_FIXED,
} from '@opentrons/components'
import { getFieldDefaultTooltip } from '../utils'
import { TextField } from './TextField'
import { StepType } from '../../../form-types'
import { FieldProps } from '../types'
import styles from '../StepEditForm.css'

type Props = FieldProps & {
  stepType: StepType
  label: string
  className: string
}
export const VolumeField = (props: Props): JSX.Element => {
  const { t } = useTranslation(['tooltip', 'application'])
  const { stepType, label, className, ...propsForVolumeField } = props
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
    strategy: TOOLTIP_FIXED,
  })

  return (
    <div {...targetProps}>
      <Tooltip {...tooltipProps}>
        {getFieldDefaultTooltip(propsForVolumeField.name, t)}
      </Tooltip>
      <FormGroup label={label} className={className}>
        <TextField
          {...propsForVolumeField}
          className={styles.small_field}
          units={t('application:units.microliter')}
        />
      </FormGroup>
    </div>
  )
}
