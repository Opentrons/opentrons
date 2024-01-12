import * as React from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'
// TODO: Ian 2018-10-19 move the processors out of steplist (chore)
import * as fieldProcessors from '../../steplist/fieldLevel/processing'
import {
  DropdownField,
  InputField,
  FormGroup,
  OutlineButton,
  DeprecatedPrimaryButton,
  Options,
} from '@opentrons/components'
import styles from './LiquidPlacementForm.css'
import formStyles from '../forms/forms.css'
import stepEditFormStyles from '../StepEditForm/StepEditForm.css'

interface ValidFormValues {
  selectedLiquidId: string
  volume: string
}

export interface LiquidPlacementFormValues {
  selectedLiquidId?: string | null
  volume?: string | null
}

export interface Props {
  commonSelectedLiquidId?: string | null
  commonSelectedVolume?: number | null
  liquidSelectionOptions: Options
  selectedWellsMaxVolume: number
  showForm: boolean
  t: any
  cancelForm: () => unknown
  clearWells: (() => unknown | null) | null
  saveForm: (liquidPlacementFormValues: LiquidPlacementFormValues) => unknown
}

export class LiquidPlacementForm extends React.Component<Props> {
  getInitialValues: () => ValidFormValues = () => {
    const { commonSelectedLiquidId, commonSelectedVolume } = this.props
    return {
      selectedLiquidId: commonSelectedLiquidId || '',
      volume: commonSelectedVolume != null ? String(commonSelectedVolume) : '',
    }
  }

  getValidationSchema: () => Yup.Schema<
    | {
        selectedLiquidId: string
        volume: number
      }
    | undefined,
    any
  > = () => {
    const { selectedWellsMaxVolume } = this.props
    return Yup.object().shape({
      selectedLiquidId: Yup.string().required(
        this.props.t('generic.error.required', {
          name: this.props.t('liquid_placement.liquid'),
        })
      ),
      volume: Yup.number()
        .nullable()
        .required(
          this.props.t('generic.error.required', {
            name: this.props.t('liquid_placement.volume'),
          })
        )
        .moreThan(0, this.props.t('generic.error.more_than_zero'))
        .max(
          selectedWellsMaxVolume,
          this.props.t('liquid_placement.volume_exceeded', {
            volume: selectedWellsMaxVolume,
          })
        ),
    })
  }

  handleCancelForm: () => void = () => {
    this.props.cancelForm()
  }

  handleClearWells: () => void = () => {
    this.props.clearWells && this.props.clearWells()
  }

  handleChangeVolume: (
    setFieldValue: (fieldName: string, value: unknown) => unknown
  ) => (e: React.ChangeEvent<any>) => void = setFieldValue => e => {
    const value: string | null | undefined = e.currentTarget.value
    const masked = fieldProcessors.composeMaskers(
      fieldProcessors.maskToFloat,
      fieldProcessors.onlyPositiveNumbers,
      fieldProcessors.trimDecimals(1)
    )(value)
    setFieldValue('volume', masked)
  }

  handleSubmit: (values: LiquidPlacementFormValues) => void = values => {
    this.props.saveForm(values)
  }

  render(): React.ReactNode | null {
    const { liquidSelectionOptions, showForm } = this.props
    if (!showForm) return null
    return (
      <div className={formStyles.form}>
        <Formik
          enableReinitialize
          initialValues={this.getInitialValues()}
          onSubmit={this.handleSubmit}
          validationSchema={this.getValidationSchema}
        >
          {({
            handleBlur,
            handleChange,
            handleSubmit,
            errors,
            setFieldValue,
            touched,
            values,
          }) => (
            <form onSubmit={handleSubmit}>
              <div className={styles.field_row}>
                <FormGroup
                  label={this.props.t('liquid_placement.liquid')}
                  className={styles.liquid_field}
                >
                  <DropdownField
                    name="selectedLiquidId"
                    className={stepEditFormStyles.large_field}
                    options={liquidSelectionOptions}
                    error={
                      touched.selectedLiquidId ? errors.selectedLiquidId : null
                    }
                    value={values.selectedLiquidId}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </FormGroup>
                <FormGroup
                  label={this.props.t('liquid_placement.volume')}
                  className={styles.volume_field}
                >
                  <InputField
                    name="volume"
                    units={this.props.t('application:units.microliter')}
                    error={touched.volume ? errors.volume : null}
                    value={values.volume}
                    onChange={this.handleChangeVolume(setFieldValue)}
                    onBlur={handleBlur}
                  />
                </FormGroup>
              </div>

              <div className={styles.button_row}>
                <OutlineButton
                  disabled={!this.props.clearWells}
                  onClick={this.handleClearWells}
                >
                  {this.props.t('button:clear_wells')}
                </OutlineButton>
                <OutlineButton onClick={this.handleCancelForm}>
                  {this.props.t('button:cancel')}
                </OutlineButton>
                <DeprecatedPrimaryButton type="submit">
                  {this.props.t('button:save')}
                </DeprecatedPrimaryButton>
              </div>
            </form>
          )}
        </Formik>
      </div>
    )
  }
}
