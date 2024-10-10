import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Controller, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useSelector } from 'react-redux'
import * as Yup from 'yup'
import {
  Card,
  DeprecatedCheckboxField,
  DeprecatedPrimaryButton,
  Flex,
  FormGroup,
  JUSTIFY_END,
  LegacyInputField,
  OutlineButton,
  TYPOGRAPHY,
} from '@opentrons/components'
import { DEPRECATED_WHALE_GREY } from '@opentrons/shared-data'
import { selectors } from '../../labware-ingred/selectors'
import { swatchColors } from '../swatchColors'
import { ColorPicker } from '../ColorPicker'
import styles from './LiquidEditForm.module.css'
import formStyles from '../forms/forms.module.css'

import type { ColorResult } from 'react-color'
import type { LiquidGroup } from '../../labware-ingred/types'

interface LiquidEditFormProps {
  serialize: boolean
  canDelete: boolean
  deleteLiquidGroup: () => void
  cancelForm: () => void
  saveForm: (liquidGroup: LiquidGroup) => void
  displayColor?: string
  name?: string | null
  description?: string | null
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

const INVALID_DISPLAY_COLORS = ['#000000', '#ffffff', DEPRECATED_WHALE_GREY]

const liquidEditFormSchema: any = Yup.object().shape({
  name: Yup.string().required('liquid name is required'),
  displayColor: Yup.string().test(
    'disallowed-color',
    'Invalid display color',
    value => {
      if (value == null) {
        return true
      }
      return !INVALID_DISPLAY_COLORS.includes(value)
        ? !checkColor(value)
        : false
    }
  ),
  description: Yup.string(),
  serialize: Yup.boolean(),
})

export function LiquidEditForm(props: LiquidEditFormProps): JSX.Element {
  const {
    deleteLiquidGroup,
    cancelForm,
    canDelete,
    saveForm,
    displayColor,
    name: propName,
    description: propDescription,
    serialize,
  } = props
  const selectedLiquid = useSelector(selectors.getSelectedLiquidGroupState)
  const nextGroupId = useSelector(selectors.getNextLiquidGroupId)
  const liquidId = selectedLiquid.liquidGroupId ?? nextGroupId
  const { t } = useTranslation(['form', 'button'])
  const initialValues: LiquidEditFormValues = {
    name: propName ?? '',
    displayColor: displayColor ?? swatchColors(liquidId),
    description: propDescription ?? '',
    serialize: serialize || false,
  }

  const {
    handleSubmit,
    formState: { errors, touchedFields, isDirty },
    control,
    watch,
    setValue,
  } = useForm<LiquidEditFormValues>({
    defaultValues: initialValues,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    resolver: yupResolver(liquidEditFormSchema),
  })
  const name = watch('name')
  const description = watch('description')
  const color = watch('displayColor')

  const handleLiquidEdits = (values: LiquidEditFormValues): void => {
    saveForm({
      name: values.name,
      displayColor: values.displayColor,
      description: values.description ?? null,
      serialize: values.serialize ?? false,
    })
  }

  return (
    <Card className={styles.form_card}>
      <form onSubmit={handleSubmit(handleLiquidEdits)}>
        <section className={styles.section}>
          <div className={formStyles.header}>{t('liquid_edit.details')}</div>
          <div className={formStyles.row_container}>
            <FormGroup
              label={t('liquid_edit.name')}
              className={formStyles.column}
            >
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <LegacyInputField
                    name="name"
                    error={
                      touchedFields.name != null ? errors.name?.message : null
                    }
                    value={name}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </FormGroup>
            <FormGroup
              label={t('liquid_edit.description')}
              className={formStyles.column}
            >
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <LegacyInputField
                    name="description"
                    value={description}
                    onChange={field.onChange}
                  />
                )}
              />
            </FormGroup>
            <FormGroup label={t('liquid_edit.displayColor')}>
              <Controller
                name="displayColor"
                control={control}
                render={({ field }) => (
                  <ColorPicker
                    value={color}
                    onChange={(color: ColorResult['hex']) => {
                      setValue('displayColor', color)
                      field.onChange(color)
                    }}
                  />
                )}
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
            {errors.displayColor != null ? errors.displayColor.message : null}
          </Flex>
        </section>
        <section className={styles.section}>
          <div className={formStyles.header}>
            {t('liquid_edit.serialize_title')}
          </div>
          <p className={styles.info_text}>
            {t('liquid_edit.serialize_explanation')}
          </p>
          <Controller
            control={control}
            name="serialize"
            render={({ field }) => (
              <DeprecatedCheckboxField
                name="serialize"
                label={t('liquid_edit.serialize')}
                value={field.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  field.onChange(e)
                }}
              />
            )}
          />
        </section>

        <div className={styles.button_row}>
          <OutlineButton onClick={deleteLiquidGroup} disabled={!canDelete}>
            {t('button:delete')}
          </OutlineButton>
          <DeprecatedPrimaryButton onClick={cancelForm}>
            {t('button:cancel')}
          </DeprecatedPrimaryButton>
          <DeprecatedPrimaryButton
            disabled={
              name == null ||
              errors.name != null ||
              name === '' ||
              errors.displayColor != null ||
              !isDirty
            }
            type="submit"
          >
            {t('button:save')}
          </DeprecatedPrimaryButton>
        </div>
      </form>
    </Card>
  )
}
