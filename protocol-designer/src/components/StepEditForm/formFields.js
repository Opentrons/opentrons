// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import {
  FormGroup,
  CheckboxField,
  InputField,
  DropdownField,
  RadioGroup,
  type DropdownOption,
} from '@opentrons/components'
import i18n from '../../localization'
import {selectors as pipetteSelectors} from '../../pipettes'
import {selectors as labwareIngredSelectors} from '../../labware-ingred/reducers'
import {actions} from '../../steplist'
import {hydrateField} from '../../steplist/fieldLevel'
import type {StepFieldName} from '../../steplist/fieldLevel'
import {DISPOSAL_PERCENTAGE} from '../../steplist/formLevel/warnings'
import {SOURCE_WELL_DISPOSAL_DESTINATION} from '../../steplist/formLevel/stepFormToArgs/transferLikeFormToArgs'
import type {ChangeTipOptions} from '../../step-generation/types'
import type {BaseState, ThunkDispatch} from '../../types'
import type {StepType} from '../../form-types'
import styles from './StepEditForm.css'
import StepField from './StepFormField'
import type {FocusHandlers} from './index'

type Options = Array<DropdownOption>

type StepCheckboxRowProps = {
  label?: string,
  name: StepFieldName,
  children?: ?React.Node,
  className?: string,
  disabled?: boolean,
  tooltipComponent?: React.Node,
}
export const StepCheckboxRow = (props: StepCheckboxRowProps) => (
  <StepField
    name={props.name}
    tooltipComponent={props.tooltipComponent}
    render={({value, updateValue, hoverTooltipHandlers}) => (
      <div className={styles.field_row}>
        <CheckboxField
          label={props.label}
          hoverTooltipHandlers={hoverTooltipHandlers}
          disabled={props.disabled}
          className={props.className}
          value={!!value}
          onChange={(e: SyntheticInputEvent<*>) => updateValue(!value)} />
        {value ? props.children : null}
      </div>
    )} />
)

type StepInputFieldProps = {name: StepFieldName} & FocusHandlers
export const StepInputField = (props: StepInputFieldProps & React.ElementProps<typeof InputField>) => {
  const {name, focusedField, dirtyFields, onFieldFocus, onFieldBlur, ...inputProps} = props
  return (
    <StepField
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({value, updateValue, errorToShow, hoverTooltipHandlers}) => (
        <InputField
          {...inputProps}
          error={errorToShow}
          onBlur={() => { onFieldBlur(name) }}
          onFocus={() => { onFieldFocus(name) }}
          onChange={(e: SyntheticInputEvent<*>) => updateValue(e.currentTarget.value)}
          value={value ? String(value) : null} />
      )} />
  )
}

type StepRadioGroupProps = {
  name: StepFieldName,
  options: $PropertyType<React.ElementProps<typeof RadioGroup>, 'options'>,
} & FocusHandlers
export const StepRadioGroup = (props: StepRadioGroupProps) => {
  const {name, onFieldFocus, onFieldBlur, focusedField, dirtyFields, ...radioGroupProps} = props
  return (
    <StepField
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({value, updateValue, errorToShow}) => (
        <RadioGroup
          {...radioGroupProps}
          value={value ? String(value) : ''}
          error={errorToShow}
          onChange={(e: SyntheticEvent<*>) => {
            updateValue(e.currentTarget.value)
            onFieldBlur(name)
          }} />
      )} />
  )
}

type DispenseDelayFieldsProps = {
  focusHandlers: FocusHandlers,
  label?: string,
  disabled?: boolean,
  tooltipComponent?: React.Node,
}
export function DispenseDelayFields (props: DispenseDelayFieldsProps) {
  const {label = 'Delay', focusHandlers, tooltipComponent, disabled} = props
  return (
    <StepCheckboxRow
      disabled={disabled}
      tooltipComponent={tooltipComponent}
      name="dispense_delay_checkbox"
      label={label}>
      <StepInputField {...focusHandlers} disabled={disabled} name="dispense_delayMinutes" units='m' />
      <StepInputField {...focusHandlers} disabled={disabled} name="dispense_delaySeconds" units='s' />
    </StepCheckboxRow>
  )
}

type PipetteFieldOP = {name: StepFieldName, stepType?: StepType} & FocusHandlers
type PipetteFieldSP = {pipetteOptions: Options, getHydratedPipette: (string) => any} // TODO: real hydrated pipette type
type PipetteFieldDP = {updateDisposalVolume: (?mixed) => void}
type PipetteFieldProps = PipetteFieldOP & PipetteFieldSP & PipetteFieldDP
const PipetteFieldSTP = (state: BaseState, ownProps: PipetteFieldOP): PipetteFieldSP => ({
  pipetteOptions: pipetteSelectors.equippedPipetteOptions(state),
  getHydratedPipette: (value) => hydrateField(state, ownProps.name, value),
})
const PipetteFieldDTP = (dispatch: ThunkDispatch<*>): PipetteFieldDP => ({
  updateDisposalVolume: (disposalVolume: ?mixed) => {
    dispatch(actions.changeFormInput({update: {aspirate_disposalVol_volume: disposalVolume}}))
  },
})
export const PipetteField = connect(PipetteFieldSTP, PipetteFieldDTP)((props: PipetteFieldProps) => (
  <StepField
    name={props.name}
    focusedField={props.focusedField}
    dirtyFields={props.dirtyFields}
    render={({value, updateValue, hoverTooltipHandlers}) => (
      <FormGroup label='Pipette:' className={styles.pipette_field} hoverTooltipHandlers={hoverTooltipHandlers}>
        <DropdownField
          options={props.pipetteOptions}
          value={value ? String(value) : null}
          onBlur={() => { props.onFieldBlur(props.name) }}
          onFocus={() => { props.onFieldFocus(props.name) }}
          onChange={(e: SyntheticEvent<HTMLSelectElement>) => {
            updateValue(e.currentTarget.value)
            if (props.stepType === 'distribute') {
              const hydratedPipette = props.getHydratedPipette(e.currentTarget.value)
              if (hydratedPipette) {
                props.updateDisposalVolume(hydratedPipette.maxVolume * DISPOSAL_PERCENTAGE)
              }
            }
          }} />
      </FormGroup>
    )} />
))

type DisposalDestinationDropdownOP = {name: StepFieldName, className?: string} & FocusHandlers
type DisposalDestinationDropdownSP = {options: Options}
const DisposalDestinationDropdownSTP = (state: BaseState): DisposalDestinationDropdownSP => ({
  options: labwareIngredSelectors.disposalLabwareOptions(state),
})
export const DisposalDestinationDropdown = connect(DisposalDestinationDropdownSTP)((props: DisposalDestinationDropdownOP & DisposalDestinationDropdownSP) => {
  const {options, name, className, focusedField, dirtyFields, onFieldBlur, onFieldFocus} = props
  return (
    <StepField
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({value, updateValue}) => (
        <DropdownField
          className={className}
          options={[...options, {name: 'Source Well', value: SOURCE_WELL_DISPOSAL_DESTINATION}]}
          onBlur={() => { onFieldBlur(name) }}
          onFocus={() => { onFieldFocus(name) }}
          value={value ? String(value) : null}
          onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.currentTarget.value) } } />
      )} />
  )
})

type LabwareDropdownOP = {name: StepFieldName, className?: string} & FocusHandlers
type LabwareDropdownSP = {labwareOptions: Options}
const LabwareDropdownSTP = (state: BaseState): LabwareDropdownSP => ({
  labwareOptions: labwareIngredSelectors.labwareOptions(state),
})
export const LabwareDropdown = connect(LabwareDropdownSTP)((props: LabwareDropdownOP & LabwareDropdownSP) => {
  const {labwareOptions, name, className, focusedField, dirtyFields, onFieldBlur, onFieldFocus} = props
  return (
    // TODO: BC abstract e.currentTarget.value inside onChange with fn like onChangeValue of type (value: mixed) => {}
    <StepField
      name={name}
      focusedField={focusedField}
      dirtyFields={dirtyFields}
      render={({value, updateValue}) => {
        // blank out the dropdown if labware id does not exist
        const availableLabwareIds = labwareOptions.map(opt => opt.value)
        const fieldValue = availableLabwareIds.includes(value)
          ? String(value)
          : null
        return (
          <DropdownField
            className={className}
            options={labwareOptions}
            onBlur={() => { onFieldBlur(name) }}
            onFocus={() => { onFieldFocus(name) }}
            value={fieldValue}
            onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.currentTarget.value) } }
          />
        )
      }}
    />
  )
})

const CHANGE_TIP_VALUES: Array<ChangeTipOptions> = ['always', 'once', 'never']

// NOTE: ChangeTipField not validated as of 6/27/18 so no focusHandlers needed
type ChangeTipFieldProps = {name: StepFieldName, stepType: StepType}
export const ChangeTipField = (props: ChangeTipFieldProps) => {
  const {name, stepType} = props
  const options = CHANGE_TIP_VALUES.map((value) => ({
    value,
    name: i18n.t(`form.step_edit_form.${stepType}.change_tip_option.${value}`),
  }))
  return (
    <StepField
      name={name}
      render={({value, updateValue, hoverTooltipHandlers}) => (
        <FormGroup
          label={i18n.t('form.step_edit_form.field.change_tip.label')}
          hoverTooltipHandlers={hoverTooltipHandlers}
        >
          <DropdownField
            options={options}
            value={value ? String(value) : null}
            onChange={(e: SyntheticEvent<HTMLSelectElement>) => { updateValue(e.currentTarget.value) } } />
        </FormGroup>
      )} />
  )
}
