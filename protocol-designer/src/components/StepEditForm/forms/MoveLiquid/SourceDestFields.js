// @flow
import * as React from 'react'
import {FormGroup, IconButton, HoverTooltip} from '@opentrons/components'

import type {StepFieldName} from '../../../../steplist/fieldLevel'
import i18n from '../../../../localization'

import type {FocusHandlers} from '../../types'

import {
  LabwareField,
  TextField,
  CheckboxRowField,
  BlowoutLocationField,
  TipPositionField,
  FlowRateField,
  WellSelectionField,
  WellOrderField,
} from '../../fields'

import styles from '../../StepEditForm.css'

type Props = {
  className?: ?string,
  collapsed?: ?boolean,
  toggleCollapsed: () => mixed,
  focusHandlers: FocusHandlers,
  prefix: 'aspirate' | 'dispense',
}

const makeAddFieldNamePrefix = (prefix: string) => (fieldName: string): StepFieldName => `${prefix}_${fieldName}`

function SourceDestFields (props: Props) {
  const {className, collapsed, toggleCollapsed, focusHandlers, prefix} = props
  const addFieldNamePrefix = makeAddFieldNamePrefix(prefix)
  const labwareLabel = prefix === 'aspirate' ? 'Source:' : 'Destination:'

  return (
    <div className={className}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>{prefix}</span>
        <HoverTooltip
          key={collapsed ? 'collapsed' : 'expanded'} // NOTE: without this key, the IconButton will not re-render unless clicked
          tooltipComponent={i18n.t('tooltip.advanced_settings')}>
          {(hoverTooltipHandlers) => (
            <div {...hoverTooltipHandlers} onClick={toggleCollapsed} className={styles.advanced_settings_button_wrapper}>
              <IconButton className={styles.advanced_settings_button} name="settings" hover={!collapsed} />
            </div>
          )}
        </HoverTooltip>
      </div>
      <div className={styles.form_row}>
        <FormGroup label={labwareLabel}>
          <LabwareField name={addFieldNamePrefix('labware')} {...focusHandlers} />
        </FormGroup>
        <WellSelectionField
          name={addFieldNamePrefix('wells')}
          labwareFieldName={addFieldNamePrefix('labware')}
          pipetteFieldName="pipette"
          {...focusHandlers} />
        {collapsed && <WellOrderField prefix={prefix} />}
      </div>

      <div>
        {!collapsed &&
          <React.Fragment>
            <div className={styles.form_row}>
              <FlowRateField
                name={addFieldNamePrefix('flowRate')}
                pipetteFieldName="pipette"
                flowRateType={prefix} />
              <TipPositionField fieldName={addFieldNamePrefix('mmFromBottom')} />
              <WellOrderField prefix={prefix} label='Well order:' />
            </div>

            <div className={styles.checkbox_column}>
              {prefix === 'aspirate' &&
                <React.Fragment>
                  <CheckboxRowField
                    name="preWetTip"
                    label="Pre-wet tip"
                    className={styles.small_field}
                  />
                  <CheckboxRowField
                    disabled
                    tooltipComponent={i18n.t('tooltip.not_in_beta')}
                    name="aspirate_airGap_checkbox"
                    label="Air Gap"
                    className={styles.small_field}
                  >
                    <TextField disabled name="aspirate_airGap_volume" units="μL" {...focusHandlers} />
                  </CheckboxRowField>
                </React.Fragment>
              }
              <CheckboxRowField
                name={addFieldNamePrefix('touchTip_checkbox')}
                label="Touch tip"
                className={styles.small_field}
              >
                <TipPositionField fieldName={addFieldNamePrefix('touchTip_mmFromBottom')} />
              </CheckboxRowField>
              <CheckboxRowField
                name={addFieldNamePrefix('mix_checkbox')}
                label='Mix'
                className={styles.small_field}>
                <TextField
                  name={addFieldNamePrefix('mix_volume')}
                  units="μL"
                  className={styles.small_field}
                  {...focusHandlers} />
                <TextField
                  name={addFieldNamePrefix('mix_times')}
                  units="Times"
                  className={styles.small_field}
                  {...focusHandlers} />
              </CheckboxRowField>
              {prefix === 'dispense' &&
                <CheckboxRowField name='blowout_checkbox' label='Blowout' className={styles.small_field}>
                  <BlowoutLocationField
                    name="blowout_location"
                    className={styles.full_width}
                    {...focusHandlers} />
                </CheckboxRowField>
              }
            </div>
          </React.Fragment>
        }
      </div>
    </div>
  )
}

export default SourceDestFields
