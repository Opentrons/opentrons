// @flow
import * as React from 'react'
import {
  FormGroup,
  Tooltip,
  useHoverTooltip,
  TOOLTIP_TOP,
  TOOLTIP_FIXED,
} from '@opentrons/components'
import { i18n } from '../../../localization'
import { getFieldDefaultTooltip } from '../utils'
import { TextField } from './TextField'
import type { StepType } from '../../../form-types'
import type { FieldProps } from '../types'
import styles from '../StepEditForm.css'

type Props = {|
  ...FieldProps,
  stepType: StepType,
  label: string,
  className: string,
|}
export const VolumeField = (props: Props): React.Node => {
  const { stepType, label, className, ...propsForVolumeField } = props
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: TOOLTIP_TOP,
    strategy: TOOLTIP_FIXED,
  })

  return (
    <div {...targetProps}>
      <Tooltip {...tooltipProps}>
        {getFieldDefaultTooltip(propsForVolumeField.name)}
      </Tooltip>
      <FormGroup label={label} className={className}>
        <TextField
          {...propsForVolumeField}
          className={styles.small_field}
          units={i18n.t('application.units.microliter')}
        />
      </FormGroup>
    </div>
  )
}
