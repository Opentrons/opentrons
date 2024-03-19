import * as React from 'react'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { FormGroup } from '@opentrons/components'
import { MAGNETIC_MODULE_V1 } from '@opentrons/shared-data'
import { selectors as uiModuleSelectors } from '../../../ui/modules'
import { selectors as stepFormSelectors } from '../../../step-forms'
import { maskField } from '../../../steplist/fieldLevel'
import { TextField, RadioGroupField } from '../fields'
import styles from '../StepEditForm.module.css'

import { StepFormProps } from '../types'

export const MagnetForm = (props: StepFormProps): JSX.Element => {
  const moduleLabwareOptions = useSelector(
    uiModuleSelectors.getMagneticLabwareOptions
  )
  const { t } = useTranslation(['application', 'form'])

  const moduleEntities = useSelector(stepFormSelectors.getModuleEntities)
  const { magnetAction, moduleId } = props.formData
  const moduleModel = moduleId ? moduleEntities[moduleId]?.model : null

  const moduleOption: string | null | undefined = moduleLabwareOptions[0]
    ? moduleLabwareOptions[0].name
    : 'No magnetic module'

  const defaultEngageHeight = useSelector(
    uiModuleSelectors.getMagnetLabwareEngageHeight
  )

  const engageHeightCaption = defaultEngageHeight
    ? `Recommended: ${String(maskField('engageHeight', defaultEngageHeight))}`
    : null

  const { propsForFields } = props

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {t('stepType.magnet')}
        </span>
      </div>

      <div className={styles.magnet_section_wrapper}>
        <FormGroup
          label={t('form:step_edit_form.field.moduleActionLabware.label')}
          className={styles.magnet_form_group}
        >
          <p className={styles.module_labware_text}>{moduleOption}</p>
        </FormGroup>
        <FormGroup
          label={t('form:step_edit_form.field.magnetAction.label')}
          className={styles.magnet_form_group}
        >
          <RadioGroupField
            {...propsForFields.magnetAction}
            options={[
              {
                name: t('step_edit_form.field.magnetAction.options.engage'),
                value: 'engage',
              },
            ]}
          />
          <RadioGroupField
            {...propsForFields.magnetAction}
            options={[
              {
                name: t('step_edit_form.field.magnetAction.options.disengage'),
                value: 'disengage',
              },
            ]}
          />
        </FormGroup>
        {magnetAction === 'engage' && (
          <FormGroup
            label={t('step_edit_form.field.engageHeight.label')}
            className={styles.magnet_form_group}
          >
            <TextField
              {...propsForFields.engageHeight}
              caption={engageHeightCaption}
              className={styles.small_field}
            />
          </FormGroup>
        )}
      </div>
      {magnetAction === 'engage' && (
        <div className={styles.diagram_row}>
          <div
            className={cx(
              styles.engage_height_diagram,
              moduleModel === MAGNETIC_MODULE_V1
                ? styles.engage_height_diagram_gen1
                : styles.engage_height_diagram_gen2
            )}
          />
        </div>
      )}
    </div>
  )
}
