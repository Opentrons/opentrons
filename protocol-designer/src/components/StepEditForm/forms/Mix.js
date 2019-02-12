// @flow
import * as React from 'react'
import cx from 'classnames'
import {FormGroup, IconButton, HoverTooltip} from '@opentrons/components'

import i18n from '../../../localization'

import formStyles from '../../forms/forms.css'

import {
  TextField,
  CheckboxRowField,
  BlowoutLocationField,
  PipetteField,
  VolumeField,
  LabwareField,
  ChangeTipField,
  FlowRateField,
  WellSelectionField,
  TipPositionField,
  WellOrderField,
} from '../fields'

import type {FocusHandlers} from '../types'
import styles from '../StepEditForm.css'

type Props = {focusHandlers: FocusHandlers}
type State = {collapsed?: boolean}

class MixForm extends React.Component<Props, State> {
  state = {collapsed: true}

  handleClick = (e: SyntheticEvent<>) => {
    this.setState({collapsed: !this.state.collapsed})
  }
  render () {
    const {focusHandlers} = this.props
    return (
      <React.Fragment>
        <div className={cx(styles.form_row, styles.start_group)}>
          <PipetteField name="pipette" {...focusHandlers} />
          <VolumeField label="Mix Vol:" focusHandlers={focusHandlers} stepType="mix" />
          <FormGroup label='Repetitions:' className={styles.small_field}>
            <TextField name="times" units='times' {...focusHandlers} />
          </FormGroup>
        </div>
        <div className={styles.section_divider}></div>

        <div className={styles.form_row}>
          <div className={styles.start_group}>
            <FormGroup label='Labware:' className={styles.labware_field}>
              <LabwareField name="labware" {...focusHandlers} />
            </FormGroup>
            <WellSelectionField name="wells" labwareFieldName="labware" pipetteFieldName="pipette" {...focusHandlers} />
            <WellOrderField prefix="mix" />
          </div>
          <div className={cx(styles.end_group, styles.fixed_width)}>
            <FlowRateField
              name='aspirate_flowRate'
              label='Aspirate Flow Rate'
              pipetteFieldName='pipette'
              className={styles.medium_field}
              flowRateType='aspirate' />
            <TipPositionField fieldName="mix_mmFromBottom" />
          </div>
          <div className={styles.fixed_width}></div>
        </div>
        <div className={cx(styles.form_row, styles.end_group)}>
          <div className={cx(styles.end_group, styles.fixed_width)}>
            <FlowRateField
              name='dispense_flowRate'
              label='Dispense Flow Rate'
              pipetteFieldName='pipette'
              className={styles.medium_field}
              flowRateType='dispense' />
            <div className={styles.small_field}></div>
          </div>

          <div className={cx(styles.start_group, styles.wrap_group, styles.fixed_width)}>
            <HoverTooltip tooltipComponent={i18n.t('tooltip.advanced_settings')}>
              {(hoverTooltipHandlers) => (
                <div {...hoverTooltipHandlers} onClick={this.handleClick} className={styles.advanced_settings_button_wrapper}>
                  <IconButton className={styles.advanced_settings_button} name="settings" hover={!this.state.collapsed} />
                </div>
              )}
            </HoverTooltip>
            <div className={styles.mix_hidden_fields}>
              {this.state.collapsed !== true &&
                <FormGroup label="Dispense Options">
                  <CheckboxRowField name={'mix_touchTip_checkbox'} label="Touch tip">
                    <TipPositionField className={cx(styles.small_field, styles.orphan_field)} fieldName={'mix_touchTipMmFromBottom'} />
                  </CheckboxRowField>

                  <CheckboxRowField name='blowout_checkbox' label='Blow out'>
                    <BlowoutLocationField
                      name="blowout_location"
                      className={cx(styles.medium_field, styles.orphan_field)}
                      {...focusHandlers} />
                  </CheckboxRowField>
                </FormGroup>
              }
            </div>
          </div>
        </div>

        <div className={formStyles.form_row}>
          <ChangeTipField stepType="mix" name="changeTip" />
        </div>
      </React.Fragment>
    )
  }
}

export default MixForm
