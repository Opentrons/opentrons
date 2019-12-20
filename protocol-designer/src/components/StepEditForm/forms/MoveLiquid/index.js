// @flow
import * as React from 'react'
import cx from 'classnames'
import i18n from '../../../../localization'
import type {
  StepType,
  HydratedMoveLiquidFormDataLegacy,
} from '../../../../form-types'
import {
  VolumeField,
  PipetteField,
  ChangeTipField,
  DisposalVolumeField,
  PathField,
} from '../../fields'
import styles from '../../StepEditForm.css'
import type { FocusHandlers } from '../../types'
import SourceDestFields from './SourceDestFields'
import SourceDestHeaders from './SourceDestHeaders'

type Props = {
  focusHandlers: FocusHandlers,
  stepType: StepType,
  formData: HydratedMoveLiquidFormDataLegacy,
}

type State = {
  collapsed: boolean,
}

// TODO: BC 2019-01-25 instead of passing path from here, put it in connect fields where needed
// or question if it even needs path

class MoveLiquidForm extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { collapsed: true }
  }

  toggleCollapsed = () => this.setState({ collapsed: !this.state.collapsed })

  render() {
    const { focusHandlers, stepType } = this.props
    const { collapsed } = this.state
    const { path } = this.props.formData

    return (
      <div className={styles.form_wrapper}>
        <div className={styles.section_header}>
          <span className={styles.section_header_text}>
            {i18n.t('application.stepType.moveLiquid')}
          </span>
        </div>
        <div className={styles.form_row}>
          <PipetteField name="pipette" stepType={stepType} {...focusHandlers} />
          <VolumeField
            label={i18n.t('form.step_edit_form.field.volume.label')}
            focusHandlers={focusHandlers}
            stepType={stepType}
          />
        </div>

        <div className={styles.section_wrapper}>
          <SourceDestHeaders
            className={styles.section_column}
            focusHandlers={focusHandlers}
            collapsed={collapsed}
            toggleCollapsed={this.toggleCollapsed}
            prefix="aspirate"
          />
          <SourceDestHeaders
            className={styles.section_column}
            focusHandlers={focusHandlers}
            collapsed={collapsed}
            toggleCollapsed={this.toggleCollapsed}
            prefix="dispense"
          />
        </div>

        {!collapsed && (
          <div
            className={cx(
              styles.section_wrapper,
              styles.advanced_settings_panel
            )}
          >
            <SourceDestFields
              className={styles.section_column}
              focusHandlers={focusHandlers}
              collapsed={collapsed}
              toggleCollapsed={this.toggleCollapsed}
              prefix="aspirate"
            />
            <SourceDestFields
              className={styles.section_column}
              focusHandlers={focusHandlers}
              collapsed={collapsed}
              toggleCollapsed={this.toggleCollapsed}
              prefix="dispense"
            />
          </div>
        )}

        <div className={styles.section_header}>
          <span className={styles.section_header_text}>
            {i18n.t('form.step_edit_form.section.sterility&motion')}
          </span>
        </div>
        <div className={styles.section_wrapper}>
          <div className={cx(styles.form_row, styles.section_column)}>
            <ChangeTipField name="changeTip" />
            <PathField focusHandlers={focusHandlers} />
          </div>
          <div
            className={cx(styles.section_column, styles.disposal_vol_wrapper)}
          >
            {path === 'multiDispense' && (
              <DisposalVolumeField focusHandlers={focusHandlers} />
            )}
          </div>
        </div>
      </div>
    )
  }
}

export default MoveLiquidForm
