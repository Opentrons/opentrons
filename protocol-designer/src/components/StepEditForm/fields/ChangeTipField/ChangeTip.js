// @flow
import * as React from 'react'
import { FormGroup, HoverTooltip, SelectField } from '@opentrons/components'
import i18n from '../../../../localization'
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

export const ChangeTip = (props: Props) => {
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
              <HoverTooltip
                positionFixed
                tooltipComponent={
                  <div className={styles.tooltip}>
                    {i18n.t(
                      `form.step_edit_form.field.change_tip.option_tooltip.${value}`
                    )}
                  </div>
                }
                placement="bottom"
                modifiers={{
                  offset: { offset: `0, 18` },
                  preventOverflow: { boundariesElement: 'window' },
                }}
              >
                {hoverTooltipHandlers => (
                  <div {...hoverTooltipHandlers}>
                    {i18n.t(
                      `form.step_edit_form.field.change_tip.option.${value}`
                    )}
                  </div>
                )}
              </HoverTooltip>
            )}
          />
        </FormGroup>
      )}
    />
  )
}
