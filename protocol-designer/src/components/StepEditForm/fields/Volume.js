// @flow
import * as React from 'react'
import { FormGroup, HoverTooltip } from '@opentrons/components'
import i18n from '../../../localization'
import { getTooltipForField } from '../utils'
import TextField from './Text'
import type { StepType } from '../../../form-types'
import type { FocusHandlers } from '../types'
import styles from '../StepEditForm.css'

type Props = {|
  stepType: StepType,
  focusHandlers: FocusHandlers,
  label: string,
|}
const Volume = (props: Props) => (
  <HoverTooltip
    tooltipComponent={getTooltipForField(props.stepType, 'volume', false)}
    placement="top-start"
  >
    {hoverTooltipHandlers => (
      <FormGroup
        label={props.label}
        className={styles.large_field}
        hoverTooltipHandlers={hoverTooltipHandlers}
      >
        <TextField
          className={styles.small_field}
          name="volume"
          units={i18n.t('application.units.microliter')}
          {...props.focusHandlers}
        />
      </FormGroup>
    )}
  </HoverTooltip>
)

export default Volume
