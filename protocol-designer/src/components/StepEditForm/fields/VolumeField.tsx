import { useTranslation } from 'react-i18next'
import {
  FormGroup,
  LegacyTooltip,
  useHoverTooltip,
  TOOLTIP_TOP,
  TOOLTIP_FIXED,
} from '@opentrons/components'
import { getFieldDefaultTooltip } from '../utils'
import { TextField } from './TextField'
import styles from '../StepEditForm.module.css'
import type { StepType } from '../../../form-types'
import type { FieldProps } from '../types'

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
      <LegacyTooltip {...tooltipProps}>
        {getFieldDefaultTooltip(propsForVolumeField.name, t)}
      </LegacyTooltip>
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
