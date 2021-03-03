// @flow
import * as React from 'react'
import {
  FormGroup,
  SelectField,
  Tooltip,
  useHoverTooltip,
  TOOLTIP_FIXED,
} from '@opentrons/components'
import { i18n } from '../../../../localization'
import {
  getDisabledChangeTipOptions,
  type DisabledChangeTipArgs,
} from './getDisabledChangeTipOptions'
import type { ChangeTipOptions } from '../../../../step-generation/types'
import type { FieldProps } from '../../types'
import styles from '../../StepEditForm.css'

const ALL_CHANGE_TIP_VALUES: Array<ChangeTipOptions> = [
  'always',
  'once',
  'perSource',
  'perDest',
  'never',
]
type Props = {|
  ...FieldProps,
  ...DisabledChangeTipArgs,
|}

export const ChangeTipField = (props: Props): React.Node => {
  const {
    aspirateWells,
    dispenseWells,
    name,
    path,
    stepType,
    updateValue,
    value,
  } = props

  const disabledOptions = getDisabledChangeTipOptions({
    aspirateWells,
    dispenseWells,
    path,
    stepType,
  })

  const options = ALL_CHANGE_TIP_VALUES.map(value => ({
    value,
    isDisabled: disabledOptions ? disabledOptions.has(value) : false,
  }))

  return (
    <FormGroup
      label={i18n.t('form.step_edit_form.field.change_tip.label')}
      className={styles.large_field}
    >
      <SelectField
        name={name}
        options={options}
        value={value ? String(value) : null}
        onValueChange={(name, value) => updateValue(value)}
        formatOptionLabel={({ value }) => (
          <ChangeTipOptionLabel value={value} />
        )}
      />
    </FormGroup>
  )
}

type LabelProps = {
  value: string,
}

const ChangeTipOptionLabel = (props: LabelProps) => {
  const { value } = props
  const [targetProps, tooltipProps] = useHoverTooltip({
    placement: 'bottom-start',
    strategy: TOOLTIP_FIXED,
  })
  return (
    <>
      <div {...targetProps}>
        {i18n.t(`form.step_edit_form.field.change_tip.option.${value}`)}
        <Tooltip {...tooltipProps}>
          <div className={styles.tooltip}>
            {i18n.t(
              `form.step_edit_form.field.change_tip.option_tooltip.${value}`
            )}
          </div>
        </Tooltip>
      </div>
    </>
  )
}
