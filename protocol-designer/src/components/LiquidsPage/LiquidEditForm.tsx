import * as React from 'react'
import { useSelector } from 'react-redux'
import { Field, Formik, FormikProps } from 'formik'
import * as Yup from 'yup'
import { i18n } from '../../localization'
import { swatchColors } from '../swatchColors'
import {
  Card,
  CheckboxField,
  FormGroup,
  InputField,
  OutlineButton,
  PrimaryButton,
} from '@opentrons/components'
import { selectors } from '../../labware-ingred/selectors'
import styles from './LiquidEditForm.css'
import formStyles from '../forms/forms.css'

import { LiquidGroup } from '../../labware-ingred/types'
import { ColorPicker } from '../ColorPicker'
import { ColorResult } from 'react-color'

type Props = LiquidGroup & {
  canDelete: boolean
  deleteLiquidGroup: () => unknown
  cancelForm: () => unknown
  saveForm: (liquidGroup: LiquidGroup) => unknown
}

interface LiquidEditFormValues {
  name: string
  displayColor: string
  description?: string | null
  serialize?: boolean
  [key: string]: unknown
}
export const liquidEditFormSchema: Yup.Schema<
  { name: string; description: string; serialize: boolean } | undefined,
  any
> = Yup.object().shape({
  name: Yup.string().required(
    i18n.t('form.generic.error.required', {
      name: i18n.t('form.liquid_edit.name'),
    })
  ),
  displayColor: Yup.string(),
  description: Yup.string(),
  serialize: Yup.boolean(),
})

export function LiquidEditForm(props: Props): JSX.Element {
  const { deleteLiquidGroup, cancelForm, canDelete, saveForm } = props
  const selectedLiquid = useSelector(selectors.getSelectedLiquidGroupState)
  const nextGroupId = useSelector(selectors.getNextLiquidGroupId)
  const liquidId = selectedLiquid.liquidGroupId ?? nextGroupId

  const initialValues: LiquidEditFormValues = {
    name: props.name || '',
    displayColor: props.displayColor ?? swatchColors(liquidId),
    description: props.description || '',
    serialize: props.serialize || false,
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={liquidEditFormSchema}
      onSubmit={(values: LiquidEditFormValues) => {
        saveForm({
          name: values.name,
          displayColor: values.displayColor,
          description: values.description || null,
          serialize: values.serialize || false,
        })
      }}
    >
      {({
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
        dirty,
        errors,
        isValid,
        touched,
        values,
      }: FormikProps<LiquidEditFormValues>) => (
        <Card className={styles.form_card}>
          <form onSubmit={handleSubmit}>
            <section className={styles.section}>
              <div className={formStyles.header}>
                {i18n.t('form.liquid_edit.details')}
              </div>
              <div className={formStyles.row_container}>
                <FormGroup
                  label={i18n.t('form.liquid_edit.name')}
                  className={formStyles.column}
                >
                  <InputField
                    name="name"
                    error={touched.name ? errors.name : null}
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </FormGroup>
                <FormGroup
                  label={i18n.t('form.liquid_edit.description')}
                  className={formStyles.column}
                >
                  <InputField
                    name="description"
                    value={values.description}
                    onChange={handleChange}
                  />
                </FormGroup>
                <FormGroup label={i18n.t('form.liquid_edit.displayColor')}>
                  <Field
                    name="displayColor"
                    component={ColorPicker}
                    value={values.displayColor}
                    onChange={(color: ColorResult['hex']) => {
                      setFieldValue('displayColor', color)
                    }}
                  />
                </FormGroup>
              </div>
            </section>

            <section className={styles.section}>
              <div className={formStyles.header}>
                {i18n.t('form.liquid_edit.serialize_title')}
              </div>
              <p className={styles.info_text}>
                {i18n.t('form.liquid_edit.serialize_explanation')}
              </p>
              <CheckboxField
                name="serialize"
                label={i18n.t('form.liquid_edit.serialize')}
                value={values.serialize}
                onChange={handleChange}
              />
            </section>

            <div className={styles.button_row}>
              <OutlineButton onClick={deleteLiquidGroup} disabled={!canDelete}>
                {i18n.t('button.delete')}
              </OutlineButton>
              <PrimaryButton onClick={cancelForm}>
                {i18n.t('button.cancel')}
              </PrimaryButton>
              <PrimaryButton disabled={!dirty} type="submit">
                {i18n.t('button.save')}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}
    </Formik>
  )
}
