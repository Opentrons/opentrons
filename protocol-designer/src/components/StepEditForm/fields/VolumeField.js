// @flow
import * as React from 'react'
import { FormGroup, HoverTooltip } from '@opentrons/components'
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

  // TODO(IL, 2021-02-08): use the useHoverTooltip hook instead of deprecated HoverTooltip (see #7295)
  return (
    <HoverTooltip
      tooltipComponent={getFieldDefaultTooltip(propsForVolumeField.name)}
      placement="top-start"
    >
      {hoverTooltipHandlers => (
        <FormGroup
          label={label}
          className={className}
          hoverTooltipHandlers={hoverTooltipHandlers}
        >
          <TextField
            {...propsForVolumeField}
            className={styles.small_field}
            units={i18n.t('application.units.microliter')}
          />
        </FormGroup>
      )}
    </HoverTooltip>
  )
}
