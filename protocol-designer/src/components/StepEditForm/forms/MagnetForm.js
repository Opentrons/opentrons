// @flow
import * as React from 'react'
import { useSelector } from 'react-redux'
import { FormGroup } from '@opentrons/components'
import { selectors as uiModuleSelectors } from '../../../ui/modules'
import { i18n } from '../../../localization'
import { maskField } from '../../../steplist/fieldLevel'

import { ConditionalOnField, TextField, RadioGroupField } from '../fields'
import styles from '../StepEditForm.css'

import type { FocusHandlers } from '../types'

type MagnetFormProps = { focusHandlers: FocusHandlers }

export const MagnetForm = (props: MagnetFormProps): React.Element<'div'> => {
  const { focusHandlers } = props
  const moduleLabwareOptions = useSelector(
    uiModuleSelectors.getMagneticLabwareOptions
  )
  const moduleOption: ?string = moduleLabwareOptions[0]
    ? moduleLabwareOptions[0].name
    : 'No magnetic module'

  const defaultEngageHeight = useSelector(
    uiModuleSelectors.getMagnetLabwareEngageHeight
  )

  const engageHeightCaption = defaultEngageHeight
    ? `Recommended: ${String(maskField('engageHeight', defaultEngageHeight))}`
    : null

  return (
    <div className={styles.form_wrapper}>
      <div className={styles.section_header}>
        <span className={styles.section_header_text}>
          {i18n.t('application.stepType.magnet')}
        </span>
      </div>

      <div className={styles.magnet_section_wrapper}>
        <FormGroup
          label={i18n.t('form.step_edit_form.field.moduleActionLabware.label')}
          className={styles.magnet_form_group}
        >
          <p className={styles.module_labware_text}>{moduleOption}</p>
        </FormGroup>
        <FormGroup
          label={i18n.t('form.step_edit_form.field.magnetAction.label')}
          className={styles.magnet_form_group}
        >
          <RadioGroupField
            name="magnetAction"
            options={[
              {
                name: i18n.t(
                  'form.step_edit_form.field.magnetAction.options.engage'
                ),
                value: 'engage',
              },
            ]}
            {...focusHandlers}
          />
          <RadioGroupField
            name="magnetAction"
            options={[
              {
                name: i18n.t(
                  'form.step_edit_form.field.magnetAction.options.disengage'
                ),
                value: 'disengage',
              },
            ]}
            {...focusHandlers}
          />
        </FormGroup>
        <ConditionalOnField
          name={'magnetAction'}
          condition={val => val === 'engage'}
        >
          <FormGroup
            label={i18n.t('form.step_edit_form.field.engageHeight.label')}
            className={styles.magnet_form_group}
          >
            <TextField
              name="engageHeight"
              className={styles.small_field}
              units={i18n.t('application.units.millimeter')}
              caption={engageHeightCaption}
              {...focusHandlers}
            />
          </FormGroup>
        </ConditionalOnField>
      </div>
      <ConditionalOnField
        name={'magnetAction'}
        condition={val => val === 'engage'}
      >
        <div className={styles.diagram_row}>
          <div className={styles.engage_height_diagram} />
        </div>
      </ConditionalOnField>
    </div>
  )
}
