// @flow
import * as React from 'react'
import cx from 'classnames'
import {
  FlatButton,
  PrimaryButton,
  FormGroup,
  DropdownField,
  CheckboxField,
  InputField,
  RadioGroup,
  type DropdownOption
} from '@opentrons/components'

import WellSelectionInput from '../../containers/WellSelectionInput'
import FormSection from './FormSection'
import formStyles from '../forms.css'
import styles from './StepEditForm.css'
import type {FormSectionNames, FormSectionState} from '../../steplist/types' // TODO import from index.js
import type {FormData} from '../../form-types'

import {formConnectorFactory} from '../../utils'

type FormConnectorType = $Call<typeof formConnectorFactory, *, *>
type Options = Array<DropdownOption>

export type Props = {
  // ingredientOptions: Options,
  pipetteOptions: Options,
  labwareOptions: Options,
  formSectionCollapse: FormSectionState,
  onCancel: (event: SyntheticEvent<>) => mixed,
  onSave: (event: SyntheticEvent<>) => mixed,
  onClickMoreOptions: (event: SyntheticEvent<>) => mixed,
  onToggleFormSection: (section: FormSectionNames) => mixed => mixed, // ???
  handleChange: (accessor: string) => (event: SyntheticEvent<HTMLInputElement> | SyntheticEvent<HTMLSelectElement>) => void,
  openWellSelectionModal: (args: {labwareId: string, pipetteId: string}) => mixed,
  formData: FormData, // TODO: make sure flow will give clear warning if you put transfer field in pause form, etc
  canSave: boolean
  /* TODO Ian 2018-01-24 **type** the different forms for different stepTypes,
    this obj reflects the form selector's return values */
}

type CheckboxRowProps = {
  label?: string,
  formConnector: FormConnectorType,
  checkboxAccessor: string,
  children?: ?React.Node,
  className?: string
}
function CheckboxRow (props: CheckboxRowProps) {
  const {formConnector, checkboxAccessor, label, className} = props

  const checked = formConnector(checkboxAccessor).value

  return (
    <div className={styles.field_row}>
      <CheckboxField label={label} className={className}
        {...formConnector(checkboxAccessor)} />
      {checked ? props.children : null}
    </div>
  )
}

type MixFieldProps = {
  timesAccessor: string,
  volumeAccessor: string
} & CheckboxRowProps
function MixField (props: MixFieldProps) {
  const {
    formConnector,
    checkboxAccessor,
    timesAccessor,
    volumeAccessor,
    label
  } = props

  return (
    <CheckboxRow
      checkboxAccessor={checkboxAccessor}
      formConnector={formConnector}
      label={label || 'Mix'}
    >
      <InputField units='μL' {...formConnector(timesAccessor)} />
      <InputField units='Times' {...formConnector(volumeAccessor)} />
    </CheckboxRow>
  )
}

type DelayFieldProps = {
  minutesAccessor: string,
  secondsAccessor: string
} & CheckboxRowProps
function DelayField (props: DelayFieldProps) {
  const {
    formConnector,
    checkboxAccessor,
    minutesAccessor,
    secondsAccessor,
    label
  } = props

  return (
    <CheckboxRow
      checkboxAccessor={checkboxAccessor}
      formConnector={formConnector}
      label={label || 'Delay'}
    >
      <InputField units='m' {...formConnector(minutesAccessor)} />
      <InputField units='s' {...formConnector(secondsAccessor)} />
    </CheckboxRow>
  )
}

function FlowRateField () {
  // NOTE 2018-05-31 Flow rate cannot yet be adjusted,
  // this is a placeholder
  return (
    <FormGroup label='FLOW RATE'>
      Default
    </FormGroup>
  )
}

function TipPositionField () {
  // NOTE 2018-05-31 Tip position cannot yet be adjusted,
  // this is a placeholder
  return (
    <FormGroup label='TIP POSITION'>
      Bottom, center
    </FormGroup>
  )
}

export default function StepEditForm (props: Props) {
  const {formData} = props
  const formConnector = formConnectorFactory(props.handleChange, formData)

  const pipetteField = (
    <FormGroup label='Pipette:' className={styles.pipette_field}>
      <DropdownField
        options={props.pipetteOptions}
        {...formConnector('pipette')} />
    </FormGroup>
  )

  const volumeField = (
    <FormGroup label='Volume:' className={styles.volume_field}>
      <InputField units='μL' {...formConnector('volume')} />
    </FormGroup>
  )

  const buttonRow = <div className={styles.button_row}>
    <FlatButton className={styles.more_options_button} onClick={props.onClickMoreOptions}>
      MORE OPTIONS
    </FlatButton>
    <PrimaryButton className={styles.cancel_button} onClick={props.onCancel}>CANCEL</PrimaryButton>
    <PrimaryButton disabled={!props.canSave} onClick={props.onSave}>SAVE</PrimaryButton>
  </div>

  const formColumnRight = <div className={styles.right_settings_column}>
      <FormGroup label='CHANGE TIP'>
          <DropdownField
            {...formConnector('aspirate--change-tip')}
            options={[
              {name: 'Always', value: 'always'},
              {name: 'Once', value: 'once'},
              {name: 'Never', value: 'never'}
            ]}
          />
      </FormGroup>

    <FlowRateField />
    <TipPositionField />
  </div>

  // TODO Ian 2018-05-08 break these forms out into own components, put it all in a folder.
  // Especially, make components for the re-used form parts instead of repeating them
  if (formData.stepType === 'mix') {
    return (
      <div className={formStyles.form}>
        <div className={formStyles.row_wrapper}>
          {/* TODO Ian 2018-05-08 this labware/wells/pipette could be a component,
            it's common across most forms */}
          <FormGroup label='Labware:' className={styles.labware_field}>
            <DropdownField options={props.labwareOptions} {...formConnector('labware')} />
          </FormGroup>
          {/* TODO LATER: also 'disable' when selected labware is a trash */}
          <WellSelectionInput
            className={styles.well_selection_input}
            labwareId={formData['labware']}
            pipetteId={formData['pipette']}
            initialSelectedWells={formData['wells']}
            formFieldAccessor={'wells'}
          />
          {pipetteField}
        </div>

        <div className={cx(formStyles.row_wrapper)}>
          <FormGroup label='Repetitions' className={styles.field_row}>
            <InputField units='uL' {...formConnector('volume')} />
            <InputField units='Times' {...formConnector('times')} />
          </FormGroup>
        </div>

        <div className={formStyles.row_wrapper}>
          <div className={styles.left_settings_column}>
            <FormGroup label='TECHNIQUE'>
              <DelayField
                checkboxAccessor='dispense--delay--checkbox'
                formConnector={formConnector}
                minutesAccessor='dispense--delay-minutes'
                secondsAccessor='dispense--delay-seconds'
              />
              <CheckboxRow
                checkboxAccessor='dispense--blowout--checkbox'
                formConnector={formConnector}
                label='Blow out'
              >
                <DropdownField className={styles.full_width}
                  options={props.labwareOptions}
                  {...formConnector('dispense--blowout--labware')}
                />
              </CheckboxRow>

              <CheckboxRow
                checkboxAccessor='touch-tip'
                formConnector={formConnector}
                label='Touch tip'
              />
            </FormGroup>
          </div>
          {formColumnRight}
        </div>
        {buttonRow}
      </div>
    )
  }

  if (formData.stepType === 'pause') {
    return (
      <div className={formStyles.form}>
        <div className={formStyles.row_wrapper}>
          <div className={formStyles.column_1_2}>
            <RadioGroup options={[{name: 'Pause for an amount of time', value: 'true'}]}
              {...formConnector('pause-for-amount-of-time')} />
            <InputField units='hr' {...formConnector('pause-hour')} />
            <InputField units='m' {...formConnector('pause-minute')} />
            <InputField units='s' {...formConnector('pause-second')} />
          </div>
          <div className={formStyles.column_1_2}>
            <RadioGroup options={[{name: 'Pause until told to resume', value: 'false'}]}
              {...formConnector('pause-for-amount-of-time')} />
            <FormGroup label='Message to display'>
              <InputField {...formConnector('pause-message')} />
            </FormGroup>
          </div>
        </div>
        {buttonRow}
      </div>
    )
  }

  if (formData.stepType === 'transfer' ||
    formData.stepType === 'consolidate' ||
    formData.stepType === 'distribute'
  ) {
    return (
      <div className={cx(formStyles.form, styles[formData.stepType])}>
        <FormSection title='Aspirate'
          onCollapseToggle={props.onToggleFormSection('aspirate')}
          collapsed={props.formSectionCollapse.aspirate}
        >
          <div className={formStyles.row_wrapper}>
            <FormGroup label='Labware:' className={styles.labware_field}>
              <DropdownField options={props.labwareOptions} {...formConnector('aspirate--labware')} />
            </FormGroup>
            {/* TODO LATER: also 'disable' when selected labware is a trash */}
            <WellSelectionInput
              className={styles.well_selection_input}
              labwareId={formData['aspirate--labware']}
              pipetteId={formData['pipette']}
              initialSelectedWells={formData['aspirate--wells']}
              formFieldAccessor={'aspirate--wells'}
            />
            {pipetteField}
            {formData.stepType === 'consolidate' && volumeField}
          </div>

          <div className={formStyles.row_wrapper}>
            <div className={styles.left_settings_column}>
              <FormGroup label='TECHNIQUE'>
                <CheckboxRow
                  checkboxAccessor='aspirate--pre-wet-tip'
                  formConnector={formConnector}
                  label='Pre-wet tip'
                />

                <CheckboxRow
                  checkboxAccessor='aspirate--touch-tip'
                  formConnector={formConnector}
                  label='Touch tip'
                />

                <CheckboxRow
                  checkboxAccessor='aspirate--air-gap--checkbox'
                  formConnector={formConnector}
                  label='Air Gap'
                >
                  <InputField units='μL' {...formConnector('aspirate--air-gap--volume')} />
                </CheckboxRow>

                <MixField
                  checkboxAccessor='aspirate--mix--checkbox'
                  formConnector={formConnector}
                  timesAccessor='aspirate--mix--times'
                  volumeAccessor='aspirate--mix--volume'
                />

                <CheckboxRow
                  checkboxAccessor='aspirate--disposal-vol--checkbox'
                  formConnector={formConnector}
                  label='Disposal Volume'
                >
                  <InputField units='μL' {...formConnector('aspirate--disposal-vol--volume')} />
                </CheckboxRow>
              </FormGroup>
            </div>
            {formColumnRight}
          </div>

        </FormSection>

        <FormSection title='Dispense'
          onCollapseToggle={props.onToggleFormSection('dispense')}
          collapsed={props.formSectionCollapse.dispense}
        >
          <div className={formStyles.row_wrapper}>
            <FormGroup label='Labware:' className={styles.labware_field}>
              <DropdownField options={props.labwareOptions} {...formConnector('dispense--labware')} />
            </FormGroup>
            <WellSelectionInput
              className={styles.well_selection_input}
              labwareId={formData['dispense--labware']}
              pipetteId={formData['pipette']}
              initialSelectedWells={formData['dispense--wells']}
              formFieldAccessor={'dispense--wells'}
            />
            {(formData.stepType === 'transfer' || formData.stepType === 'distribute') &&
              volumeField}
          </div>

          <div className={formStyles.row_wrapper}>
            <div className={styles.left_settings_column}>
              <FormGroup label='TECHNIQUE'>
                <MixField
                  checkboxAccessor='dispense--mix--checkbox'
                  formConnector={formConnector}
                  volumeAccessor='dispense--mix--volume'
                  timesAccessor='dispense--mix--times'
                />
                <DelayField
                  checkboxAccessor='dispense--delay--checkbox'
                  formConnector={formConnector}
                  minutesAccessor='dispense--delay-minutes'
                  secondsAccessor='dispense--delay-seconds'
                />

                <CheckboxRow
                  checkboxAccessor='dispense--blowout--checkbox'
                  formConnector={formConnector}
                  label='Blow out'
                >
                  <DropdownField className={styles.full_width}
                    options={props.labwareOptions}
                    {...formConnector('dispense--blowout--labware')}
                  />
                </CheckboxRow>
              </FormGroup>
            </div>

            <div className={styles.right_settings_column}>
              <FlowRateField />
              <TipPositionField />
            </div>
          </div>

        </FormSection>

        {buttonRow}
      </div>
    )
  }

  return (
    <div className={formStyles.form}>
      <div>Todo: support {formData.stepType} step</div>
    </div>
  )
}
