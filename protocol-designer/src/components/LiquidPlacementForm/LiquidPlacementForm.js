// @flow
import * as React from 'react'
import {Formik} from 'formik'
import * as Yup from 'yup'
// TODO: Ian 2018-10-19 move the processors out of steplist (chore)
import * as fieldProcessors from '../../steplist/fieldLevel/processing'
import {
  DropdownField,
  InputField,
  FormGroup,
  OutlineButton,
  PrimaryButton,
} from '@opentrons/components'
import i18n from '../../localization'
import styles from './LiquidPlacementForm.css'
import formStyles from '../forms.css'
import type {Options} from '../../types'

export type ValidFormValues = {
  selectedLiquidId: string,
  volume: string,
}

type Props = {
  commonSelectedLiquidId: ?string,
  commonSelectedVolume: ?number,
  liquidSelectionOptions: Options,
  selectedWellsMaxVolume: number,
  showForm: boolean,

  cancelForm: () => mixed,
  clearWells: () => mixed,
  saveForm: (ValidFormValues) => mixed,
}

export default class LiquidPlacementForm extends React.Component <Props> {
  getInitialValues = () => {
    const {commonSelectedLiquidId, commonSelectedVolume} = this.props
    return {
      selectedLiquidId: commonSelectedLiquidId || '',
      volume: commonSelectedVolume,
    }
  }

  getValidationSchema = () => {
    const {selectedWellsMaxVolume} = this.props
    return Yup.object().shape({
      selectedLiquidId: Yup
        .string()
        .required(
          i18n.t('form.generic.error.required',
          {name: i18n.t('form.liquid_placement.liquid')})),
      volume: Yup.number()
        .nullable()
        .required(i18n.t('form.generic.error.required',
          {name: i18n.t('form.liquid_placement.volume')}))
        .moreThan(0, i18n.t('form.generic.error.more_than_zero'))
        .max(
          selectedWellsMaxVolume,
          i18n.t('form.liquid_placement.volume_exceeded', {volume: selectedWellsMaxVolume})),
    })
  }

  handleCancelForm = () => {
    this.props.cancelForm()
  }

  handleClearWells = () => {
    this.props.clearWells()
  }

  handleChangeVolume = (setFieldValue: *) => (e: SyntheticInputEvent<*>) => {
    const value: ?string = e.currentTarget.value
    const processed = fieldProcessors.composeProcessors(
      fieldProcessors.castToFloat,
      fieldProcessors.onlyPositiveNumbers,
    )(value)
    setFieldValue('volume', processed)
  }

  handleSubmit = (values: ValidFormValues) => {
    this.props.saveForm(values)
  }

  render () {
    const {liquidSelectionOptions, showForm} = this.props
    if (!showForm) return null
    return (
      <div className={formStyles.form}>
        <Formik
          enableReinitialize
          initialValues={this.getInitialValues()}
          onSubmit={this.handleSubmit}
          validationSchema={this.getValidationSchema}
          render={({handleBlur, handleChange, handleSubmit, errors, setFieldValue, touched, values}) => (
          <form onSubmit={handleSubmit}>
            <div className={styles.field_row}>
              <FormGroup
                label={i18n.t('form.liquid_placement.liquid')}
                className={styles.liquid_field}>
                <DropdownField
                  name='selectedLiquidId'
                  options={liquidSelectionOptions}
                  error={touched.selectedLiquidId && errors.selectedLiquidId}
                  value={values.selectedLiquidId}
                  onChange={handleChange}
                  onBlue={handleBlur}
                />
              </FormGroup>
              <FormGroup
                label={i18n.t('form.liquid_placement.volume')}
                className={styles.volume_field}
                >
                <InputField
                  name='volume'
                  units='μL'
                  error={touched.volume && errors.volume}
                  value={values.volume}
                  onChange={this.handleChangeVolume(setFieldValue)}
                  onBlue={handleBlur}
                />
              </FormGroup>
            </div>

            <div className={styles.button_row}>
              <OutlineButton onClick={this.handleClearWells}>
                {i18n.t('button.clear_wells')}
              </OutlineButton>
              <OutlineButton onClick={this.handleCancelForm}>
                {i18n.t('button.cancel')}
              </OutlineButton>
              <PrimaryButton onClick={handleSubmit}>
                {i18n.t('button.save')}
              </PrimaryButton>
            </div>
          </form>
        )} />
      </div>
    )
  }
}
