import * as React from 'react'
import { useSelector } from 'react-redux'
import { Field, Formik, FormikProps } from 'formik'
import * as Yup from 'yup'
import { i18n } from '../../localization'
import { swatchColors } from '../swatchColors'
import {
  Card,
  DeprecatedCheckboxField,
  FormGroup,
  InputField,
  OutlineButton,
  DeprecatedPrimaryButton,
  Flex,
  JUSTIFY_END,
  TYPOGRAPHY,
  COLORS,
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

function checkColor(hex: string): boolean {
  const cleanHex = hex.replace('#', '')
  const red = parseInt(cleanHex.slice(0, 2), 16)
  const green = parseInt(cleanHex.slice(2, 4), 16)
  const blue = parseInt(cleanHex.slice(4, 6), 16)
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255
  return luminance < 0.1 || luminance > 0.9
}

const INVALID_DISPLAY_COLORS = ['#000000', '#ffffff', COLORS.whaleGrey]

export const liquidEditFormSchema: Yup.Schema<
  { name: string; description: string; serialize: boolean } | undefined,
  any
> = Yup.object().shape({
  name: Yup.string().required(
    i18n.t('form.generic.error.required', {
      name: i18n.t('form.liquid_edit.name'),
    })
  ),
  displayColor: Yup.string().test(
    'disallowed-color',
    'Invalid display color',
    value => {
      if (value == null) {
        return true
      }
      return !INVALID_DISPLAY_COLORS.includes(value)
        ? !checkColor(value)
        : !INVALID_DISPLAY_COLORS.includes(value)
    }
  ),
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
      }: FormikProps<LiquidEditFormValues>) => {
        return (
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
                <Flex
                  justifyContent={JUSTIFY_END}
                  color="#9e5e00"
                  fontSize={TYPOGRAPHY.fontSizeCaption}
                  fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  marginTop={errors.name != null ? '-0.25rem' : '0rem'}
                >
                  {errors.displayColor != null ? errors.displayColor : null}
                </Flex>
              </section>
              <section className={styles.section}>
                <div className={formStyles.header}>
                  {i18n.t('form.liquid_edit.serialize_title')}
                </div>
                <p className={styles.info_text}>
                  {i18n.t('form.liquid_edit.serialize_explanation')}
                </p>
                <DeprecatedCheckboxField
                  name="serialize"
                  label={i18n.t('form.liquid_edit.serialize')}
                  value={values.serialize}
                  onChange={handleChange}
                />
              </section>

              <div className={styles.button_row}>
                <OutlineButton
                  onClick={deleteLiquidGroup}
                  disabled={!canDelete}
                >
                  {i18n.t('button.delete')}
                </OutlineButton>
                <DeprecatedPrimaryButton onClick={cancelForm}>
                  {i18n.t('button.cancel')}
                </DeprecatedPrimaryButton>
                <DeprecatedPrimaryButton
                  disabled={
                    !dirty || errors.name != null || errors.displayColor != null
                  }
                  type="submit"
                >
                  {i18n.t('button.save')}
                </DeprecatedPrimaryButton>
              </div>
            </form>
          </Card>
        )
      }}
    </Formik>
  )
}
