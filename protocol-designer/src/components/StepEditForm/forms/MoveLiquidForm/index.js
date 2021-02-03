// @flow
import * as React from 'react'
import cx from 'classnames'
import { i18n } from '../../../../localization'
import {
  VolumeField,
  PipetteField,
  ChangeTipField,
  DisposalVolumeField,
  PathField,
} from '../../fields'
import { useSingleEditFieldProps } from '../../fields/useSingleEditFieldProps'
import styles from '../../StepEditForm.css'
import type { StepFormProps } from '../../types'
import { SourceDestFields } from './SourceDestFields'
import { SourceDestHeaders } from './SourceDestHeaders'

// TODO: BC 2019-01-25 instead of passing path from here, put it in connect fields where needed
// or question if it even needs path

export const MoveLiquidForm = (props: StepFormProps): React.Node => {
  const [collapsed, _setCollapsed] = React.useState<boolean>(true)

  const toggleCollapsed = () => _setCollapsed(!collapsed)

  const { focusHandlers } = props
  const { stepType, path } = props.formData

  const propsForFields = useSingleEditFieldProps(props.focusHandlers)
  if (propsForFields === null) return null

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {i18n.t('application.stepType.moveLiquid')}
        </span>
      </div>
      <div className={styles.form_row}>
        <PipetteField {...propsForFields['pipette']} />
        <VolumeField
          {...propsForFields['volume']}
          label={i18n.t('form.step_edit_form.field.volume.label')}
          stepType={stepType}
          className={styles.large_field}
        />
      </div>

      <div className={styles.section_wrapper}>
        <SourceDestHeaders
          className={styles.section_column}
          propsForFields={propsForFields}
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
          prefix="aspirate"
        />
        <SourceDestHeaders
          className={styles.section_column}
          propsForFields={propsForFields}
          collapsed={collapsed}
          toggleCollapsed={toggleCollapsed}
          prefix="dispense"
        />
      </div>

      {!collapsed && (
        <div
          className={cx(styles.section_wrapper, styles.advanced_settings_panel)}
        >
          <SourceDestFields
            className={styles.section_column}
            focusHandlers={focusHandlers}
            collapsed={collapsed}
            toggleCollapsed={toggleCollapsed}
            prefix="aspirate"
            propsForFields={propsForFields}
          />
          <SourceDestFields
            className={styles.section_column}
            focusHandlers={focusHandlers}
            collapsed={collapsed}
            toggleCollapsed={toggleCollapsed}
            prefix="dispense"
            propsForFields={propsForFields}
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
        <div className={cx(styles.section_column, styles.disposal_vol_wrapper)}>
          {path === 'multiDispense' && (
            <DisposalVolumeField propsForFields={propsForFields} />
          )}
        </div>
      </div>
    </div>
  )
}
