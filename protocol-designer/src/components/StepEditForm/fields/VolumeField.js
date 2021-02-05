// @flow
import * as React from 'react'
import { FormGroup, HoverTooltip } from '@opentrons/components'
import { i18n } from '../../../localization'
import { getTooltipForField } from '../utils'
import { TextField } from './TextField'
import type { StepType } from '../../../form-types'
import type { FieldProps } from './makeSingleEditFieldProps'
import styles from '../StepEditForm.css'

type Props = {|
  ...FieldProps,
  stepType: StepType,
  label: string,
  className: string,
|}
export const VolumeField = (props: Props): React.Node => {
  const { stepType, label, className, ...propsForVolumeField } = props

  // TODO IMMEDIATELY tooltip from hook
  return (
    <HoverTooltip
      tooltipComponent={getTooltipForField(stepType, 'volume', false)}
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
