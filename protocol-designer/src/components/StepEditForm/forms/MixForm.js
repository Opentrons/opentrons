// @flow
import * as React from 'react'
import cx from 'classnames'
import { FormGroup } from '@opentrons/components'

import { i18n } from '../../../localization'

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

import type { FocusHandlers } from '../types'
import styles from '../StepEditForm.css'
import { AspDispSection } from './AspDispSection'

type Props = {| focusHandlers: FocusHandlers |}
type State = {| collapsed?: boolean |}

export class MixForm extends React.Component<Props, State> {
  state: State = { collapsed: true }

  toggleCollapsed: () => void = () => {
    this.setState({ collapsed: !this.state.collapsed })
  }

  render(): React.Node {
    const { focusHandlers } = this.props
    const { collapsed } = this.state
    return (
      <div className={styles.form_wrapper}>
        <div className={styles.section_header}>
          <span className={styles.section_header_text}>
            {i18n.t('application.stepType.mix')}
          </span>
        </div>
        <div className={styles.form_row}>
          <PipetteField name="pipette" {...focusHandlers} />
          <VolumeField
            label={i18n.t('form.step_edit_form.mixVolumeLabel')}
            focusHandlers={focusHandlers}
            stepType="mix"
            className={styles.small_field}
          />
          <FormGroup
            className={styles.small_field}
            label={i18n.t('form.step_edit_form.mixRepetitions')}
          >
            <TextField
              name="times"
              units={i18n.t('application.units.times')}
              {...focusHandlers}
            />
          </FormGroup>
        </div>
        <div className={styles.form_row}>
          <FormGroup
            label={i18n.t('form.step_edit_form.labwareLabel.mixLabware')}
            className={styles.large_field}
          >
            <LabwareField name="labware" {...focusHandlers} />
          </FormGroup>
          <WellSelectionField
            name="wells"
            labwareFieldName="labware"
            pipetteFieldName="pipette"
            {...focusHandlers}
          />
        </div>
        <div className={styles.section_divider} />

        <div className={styles.section_wrapper}>
          <AspDispSection
            className={styles.section_column}
            prefix="aspirate"
            collapsed={collapsed}
            toggleCollapsed={this.toggleCollapsed}
          />
          <AspDispSection
            className={styles.section_column}
            prefix="dispense"
            collapsed={collapsed}
            toggleCollapsed={this.toggleCollapsed}
          />
        </div>

        {!collapsed && (
          <div
            className={cx(
              styles.section_wrapper,
              styles.advanced_settings_panel
            )}
          >
            <div className={styles.section_column}>
              <div className={styles.form_row}>
                <FlowRateField
                  name="aspirate_flowRate"
                  pipetteFieldName="pipette"
                  flowRateType="aspirate"
                />
                <TipPositionField fieldName="mix_mmFromBottom" />
                <WellOrderField
                  prefix="mix"
                  label={i18n.t('form.step_edit_form.field.well_order.label')}
                />
              </div>
            </div>

            <div className={styles.section_column}>
              <div className={styles.form_row}>
                <FlowRateField
                  name="dispense_flowRate"
                  pipetteFieldName="pipette"
                  flowRateType="dispense"
                />
              </div>
              <div className={styles.checkbox_column}>
                <CheckboxRowField
                  className={styles.small_field}
                  label={i18n.t('form.step_edit_form.field.touchTip.label')}
                  tooltipComponent={i18n.t(
                    'tooltip.step_fields.defaults.mix_touchTip_checkbox'
                  )}
                  name={'mix_touchTip_checkbox'}
                >
                  <TipPositionField fieldName={'mix_touchTip_mmFromBottom'} />
                </CheckboxRowField>

                <CheckboxRowField
                  className={styles.small_field}
                  label={i18n.t('form.step_edit_form.field.blowout.label')}
                  name="blowout_checkbox"
                >
                  <BlowoutLocationField
                    className={styles.full_width}
                    name="blowout_location"
                    {...focusHandlers}
                  />
                </CheckboxRowField>
              </div>
            </div>
          </div>
        )}

        <div className={styles.section_header}>
          <span className={styles.section_header_text}>
            {i18n.t('form.step_edit_form.section.sterility')}
          </span>
        </div>
        <div className={styles.section_wrapper}>
          <div className={styles.form_row}>
            <ChangeTipField name="changeTip" />
          </div>
        </div>
      </div>
    )
  }
}
