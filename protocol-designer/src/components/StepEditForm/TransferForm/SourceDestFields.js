// @flow
import * as React from 'react'
import {FormGroup, IconButton, HoverTooltip} from '@opentrons/components'

import type {StepFieldName} from '../../../steplist/fieldLevel'
import i18n from '../../../localization'

import type {FocusHandlers} from '../index'

import {
  LabwareField,
  TextField,
  CheckboxRowField,
  BlowoutLocationField,
  TipPositionField,
  FlowRateField,
  WellSelectionField,
  WellOrderField,
} from '../fields'

import styles from '../StepEditForm.css'

type Props = {
  focusHandlers: FocusHandlers,
  prefix: 'aspirate' | 'dispense',
}
type State = {collapsed?: boolean}

const makeAddFieldNamePrefix = (prefix: string) => (fieldName: string): StepFieldName => `${prefix}_${fieldName}`

class SourceDestFields extends React.Component<Props, State> {
  state = {collapsed: true}

  handleClick = (e: SyntheticEvent<>) => {
    this.setState({collapsed: !this.state.collapsed})
  }
  render () {
    const {focusHandlers} = this.props
    const path = 'single' // TODO: IMMEDIATELY this is stubbed, replace with formData (probably in downstream connected components)
    const addFieldNamePrefix = makeAddFieldNamePrefix(this.props.prefix)
    const labwareLabel = this.props.prefix === 'aspirate' ? 'Source:' : 'Destination:'
    const hiddenFieldsLabel = this.props.prefix === 'aspirate' ? 'Aspirate Options:' : 'Dispense Options:'
    return (
      <div className={styles.form_row}>
        <div className={styles.start_group}>
          <FormGroup label={labwareLabel} className={styles.labware_field}>
            <LabwareField name={addFieldNamePrefix('labware')} {...focusHandlers} />
          </FormGroup>
          <WellSelectionField
            name={addFieldNamePrefix('wells')}
            labwareFieldName={addFieldNamePrefix('labware')}
            pipetteFieldName="pipette"
            {...focusHandlers} />
          <WellOrderField prefix={this.props.prefix} />
        </div>
        <div className={styles.start_group}>
          <FlowRateField
            name={addFieldNamePrefix('flowRate')}
            pipetteFieldName="pipette"
            flowRateType={this.props.prefix} />
          <TipPositionField fieldName={addFieldNamePrefix('mmFromBottom')} />
          <HoverTooltip tooltipComponent={i18n.t('tooltip.advanced_settings')}>
            {(hoverTooltipHandlers) => (
              <div {...hoverTooltipHandlers} onClick={this.handleClick} className={styles.advanced_settings_button_wrapper}>
                <IconButton className={styles.advanced_settings_button} name="settings" hover={!this.state.collapsed} />
              </div>
            )}
          </HoverTooltip>
          <div className={styles.hidden_fields}>
            {this.state.collapsed !== true &&
              <FormGroup label={hiddenFieldsLabel}>
                {this.props.prefix === 'aspirate' &&
                  <React.Fragment>
                    <CheckboxRowField name="preWetTip" label="Pre-wet tip" />
                    <CheckboxRowField disabled tooltipComponent={i18n.t('tooltip.not_in_beta')} name="aspirate_airGap_checkbox" label="Air Gap">
                      <TextField disabled name="aspirate_airGap_volume" units="μL" {...focusHandlers} />
                    </CheckboxRowField>
                  </React.Fragment>
                }
                <CheckboxRowField name={addFieldNamePrefix('touchTip_checkbox')} label="Touch tip">
                  <TipPositionField fieldName={addFieldNamePrefix('touchTipMmFromBottom')} />
                </CheckboxRowField>
                <CheckboxRowField name={addFieldNamePrefix('mix_checkbox')} label='Mix'>
                  <TextField
                    name={addFieldNamePrefix('dispense_mix_volume')}
                    units="μL"
                    className={styles.small_field}
                    {...focusHandlers} />
                  <TextField
                    name={addFieldNamePrefix('dispense_mix_times')}
                    units="Times"
                    className={styles.small_field}
                    {...focusHandlers} />
                </CheckboxRowField>
                {(this.props.prefix === 'dispense' && path !== 'multiDispense') &&
                  <CheckboxRowField name='blowout_checkbox' label='Blowout'>
                    <BlowoutLocationField
                      name="blowout_location"
                      className={styles.full_width}
                      includeSourceWell={path === 'single'}
                      includeDestWell
                      {...focusHandlers} />
                  </CheckboxRowField>
                }
              </FormGroup>
            }
          </div>
        </div>
      </div>
    )
  }
}

export default SourceDestFields
