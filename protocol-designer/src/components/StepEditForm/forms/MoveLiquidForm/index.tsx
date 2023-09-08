import * as React from 'react'
import cx from 'classnames'
import { useSelector } from 'react-redux'
import { i18n } from '../../../../localization'
import { getLabwareDefsByURI } from '../../../../labware-defs/selectors'
import {
  VolumeField,
  PipetteField,
  ChangeTipField,
  DisposalVolumeField,
  PathField,
} from '../../fields'
import styles from '../../StepEditForm.css'
import { StepFormProps } from '../../types'
import { SourceDestFields } from './SourceDestFields'
import { SourceDestHeaders } from './SourceDestHeaders'

// TODO: BC 2019-01-25 instead of passing path from here, put it in connect fields where needed
// or question if it even needs path

export const MoveLiquidForm = (props: StepFormProps): JSX.Element => {
  const [collapsed, _setCollapsed] = React.useState<boolean>(true)
  const allLabware = useSelector(getLabwareDefsByURI)

  const toggleCollapsed = (): void => _setCollapsed(!collapsed)

  const { propsForFields, formData } = props
  const { stepType, path } = formData

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {i18n.t('application.stepType.moveLiquid')}
        </span>
      </div>
      <div className={styles.form_row}>
        <PipetteField {...propsForFields.pipette} />
        <VolumeField
          {...propsForFields.volume}
          label={i18n.t('form.step_edit_form.field.volume.label')}
          stepType={stepType}
          className={styles.large_field}
        />
      </div>

      <div className={styles.section_wrapper}>
        <SourceDestHeaders
          className={styles.section_column}
          collapsed={collapsed}
          formData={formData}
          prefix="aspirate"
          propsForFields={propsForFields}
          toggleCollapsed={toggleCollapsed}
        />
        <SourceDestHeaders
          className={styles.section_column}
          collapsed={collapsed}
          formData={formData}
          prefix="dispense"
          propsForFields={propsForFields}
          toggleCollapsed={toggleCollapsed}
        />
      </div>

      {!collapsed && (
        <div
          className={cx(styles.section_wrapper, styles.advanced_settings_panel)}
        >
          <SourceDestFields
            className={styles.section_column}
            prefix="aspirate"
            propsForFields={propsForFields}
            formData={formData}
            allLabware={allLabware}
          />
          <SourceDestFields
            className={styles.section_column}
            prefix="dispense"
            propsForFields={propsForFields}
            formData={formData}
            allLabware={allLabware}
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
          <ChangeTipField
            {...propsForFields.changeTip}
            aspirateWells={formData.aspirate_wells}
            dispenseWells={formData.dispense_wells}
            path={formData.path}
            stepType={formData.stepType}
          />
          <PathField
            {...propsForFields.path}
            aspirate_airGap_checkbox={formData.aspirate_airGap_checkbox}
            aspirate_airGap_volume={formData.aspirate_airGap_volume}
            aspirate_wells={formData.aspirate_wells}
            changeTip={formData.changeTip}
            dispense_wells={formData.dispense_wells}
            pipette={formData.pipette}
            volume={formData.volume}
          />
        </div>
        <div className={cx(styles.section_column, styles.disposal_vol_wrapper)}>
          {path === 'multiDispense' && (
            <DisposalVolumeField
              aspirate_airGap_checkbox={formData.aspirate_airGap_checkbox}
              aspirate_airGap_volume={formData.aspirate_airGap_volume}
              path={formData.path}
              pipette={formData.pipette}
              propsForFields={propsForFields}
              stepType={formData.stepType}
              volume={formData.volume}
            />
          )}
        </div>
      </div>
    </div>
  )
}
