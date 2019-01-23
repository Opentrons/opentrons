// @flow
import * as React from 'react'
import {FormGroup, IconButton, HoverTooltip} from '@opentrons/components'
import cx from 'classnames'

import type {StepFieldName} from '../../steplist/fieldLevel'
import i18n from '../../localization'

import type {FocusHandlers} from './index'
import {
  LabwareDropdown,
  StepInputField,
  StepCheckboxRow,
  BlowoutLocationDropdown,
} from './formFields'

import TipPositionInput from './TipPositionInput'
import FlowRateField from './FlowRateField'
import WellSelectionInput from './WellSelectionInput'
import WellOrderInput from './WellOrderInput'

import styles from './StepEditForm.css'

type Props = {
  focusHandlers: FocusHandlers,
  prefix: 'aspirate' | 'dispense',
}
type State = {collapsed?: boolean}

const makeAddFieldNamePrefix = (prefix: string) => (fieldName: string): StepFieldName => `${prefix}_${fieldName}`

class FormSection extends React.Component<Props, State> {
  state = {collapsed: true}

  handleClick = (e: SyntheticEvent<>) => {
    this.setState({collapsed: !this.state.collapsed})
  }
  render () {
    const path = 'single' // TODO: IMMEDIATELY this is stubbed, replace with formData (probably in downstream connected components)
    const addFieldNamePrefix = makeAddFieldNamePrefix(this.props.prefix)
    const labwareLabel = this.props.prefix === 'aspirate' ? 'Source:' : 'Destination:'
    const hiddenFieldsLabel = this.props.prefix === 'aspirate' ? 'Aspirate Options:' : 'Dispense Options:'
    return (
      <div className={styles.field_row}>
        <div className={styles.start_group}>
          <FormGroup label={labwareLabel} className={styles.labware_field}>
            <LabwareDropdown
              name={addFieldNamePrefix('labware')}
              className={styles.large_field}
              {...this.props.focusHandlers} />
          </FormGroup>
          <WellSelectionInput
            name={addFieldNamePrefix('wells')}
            labwareFieldName={addFieldNamePrefix('labware')}
            pipetteFieldName="pipette"
            {...this.props.focusHandlers} />
          <WellOrderInput prefix={this.props.prefix} />
        </div>
        <div className={styles.end_group}>
          <FlowRateField
            name={addFieldNamePrefix('flowRate')}
            pipetteFieldName="pipette"
            flowRateType={this.props.prefix} /> {/* TODO: this should be a variable */}
          <TipPositionInput fieldName={addFieldNamePrefix('mmFromBottom')} />
          <HoverTooltip tooltipComponent={i18n.t('tooltip.advanced_settings')}>
            {(hoverTooltipHandlers) => (
              <div
                {...hoverTooltipHandlers}
                onClick={this.handleClick}
                className={styles.advanced_settings_icon} >
                <IconButton name="settings" hover={!this.state.collapsed} />
              </div>
            )}
          </HoverTooltip>
        </div>
        <div className={cx(styles.start_group, styles.wrap_group)}>
          {this.state.collapsed !== true &&
            <FormGroup label={hiddenFieldsLabel}>
              {this.props.prefix === 'aspirate' &&
                <React.Fragment>
                  <StepCheckboxRow name="preWetTip" label="Pre-wet tip" />
                  <StepCheckboxRow disabled tooltipComponent={i18n.t('tooltip.not_in_beta')} name="aspirate_airGap_checkbox" label="Air Gap">
                    <StepInputField disabled name="aspirate_airGap_volume" units="μL" {...this.props.focusHandlers} />
                  </StepCheckboxRow>
                </React.Fragment>
              }
              <StepCheckboxRow name={addFieldNamePrefix('touchTip_checkbox')} label="Touch tip">
                <TipPositionInput fieldName={addFieldNamePrefix('touchTipMmFromBottom')} />
              </StepCheckboxRow>
              <StepCheckboxRow name={addFieldNamePrefix('mix_checkbox')} label='Mix'>
                <StepInputField name={addFieldNamePrefix('dispense_mix_volume')} units="μL" {...this.props.focusHandlers} />
                <StepInputField name={addFieldNamePrefix('dispense_mix_times')} units="Times" {...this.props.focusHandlers} />
              </StepCheckboxRow>
              {(this.props.prefix === 'dispense' && path !== 'multiDispense') &&
                <StepCheckboxRow name='blowout_checkbox' label='Blow out'>
                  <BlowoutLocationDropdown
                    name="blowout_location"
                    className={styles.full_width}
                    includeSourceWell={path === 'single'}
                    includeDestWell
                    {...this.props.focusHandlers} />
                </StepCheckboxRow>
              }
            </FormGroup>
          }
        </div>
      </div>
    )
  }
}

export default FormSection
