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
import { FieldConnector } from '../FieldConnector'
import styles from '../../StepEditForm.css'
import type { StepFieldName } from '../../../../steplist/fieldLevel'
import type { ChangeTipOptions } from '../../../../step-generation/types'

// NOTE: ChangeTipField not validated as of 6/27/18 so no focusHandlers needed
type Props = {
  name: StepFieldName,
  options: Array<ChangeTipOptions>,
  disabledOptions: ?Set<ChangeTipOptions>,
}

export const ChangeTip = (props: Props): React.Node => {
  const { name, disabledOptions } = props
  const options = props.options.map(value => ({
    value,
    isDisabled: disabledOptions ? disabledOptions.has(value) : false,
  }))

  return (
    <FieldConnector
      name={name}
      render={({ value, updateValue, hoverTooltipHandlers }) => (
        <FormGroup
          label={i18n.t('form.step_edit_form.field.change_tip.label')}
          className={styles.large_field}
          hoverTooltipHandlers={hoverTooltipHandlers}
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
      )}
    />
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
