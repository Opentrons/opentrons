// @flow
import * as React from 'react'
import mapValues from 'lodash/mapValues'
import {
  PrimaryButton,
  CheckboxField,
  DropdownField,
  InputField,
  FormGroup,
} from '@opentrons/components'

import styles from './IngredientPropertiesForm.css'
import formStyles from './forms.css'
import type {EditIngredientPayload} from '../labware-ingred/actions'

import type {
  IngredInputs,
  IngredGroupAccessor as Accessor,
  AllIngredGroupFields,
} from '../labware-ingred/types'

type SetStateCallback = (...args: Array<*>) => *

type SetSubstate = (accessor: string, value: string | boolean | number) => mixed
type GetSubstate = (accessor: Accessor) => string | boolean | number | null

type FieldErrors = {[errorField: string]: string}

type FieldProps = {|
  accessor: Accessor,
  numeric?: boolean,
  type?: string,
  label?: string,
  units?: string,
  error?: ?string,
  caption?: ?string,
  placeholder?: string,
  className?: string,
|}

const makeInputField = (args: {setSubstate: SetSubstate, getSubstate: GetSubstate}) =>
  function InputFieldFactory (props: FieldProps) { /* otherProps */
    const {setSubstate, getSubstate} = args
    const {accessor, numeric, type, placeholder, className} = props

    if (!type || type === 'input') {
      return <InputField
        className={className}
        label={props.label}
        units={props.units}
        error={props.error}
        caption={props.caption}
        placeholder={placeholder}
        value={(getSubstate(accessor) || '').toString()}
        onChange={(e: SyntheticInputEvent<HTMLInputElement>) =>
          setSubstate(accessor, numeric ? parseFloat(e.target.value) : e.target.value)
        }
      />
    }

    if (type === 'checkbox') {
      return <CheckboxField
        className={className}
        label={props.label}
        value={getSubstate(accessor) === true}
        onChange={(e: SyntheticInputEvent<*>) => setSubstate(accessor, !getSubstate(accessor))}
      />
    }

    return <input
      className={className}
      id={accessor}
      value={getSubstate(accessor) || ''}
      onChange={(e: SyntheticInputEvent<HTMLInputElement>) =>
        setSubstate(accessor, numeric ? parseFloat(e.target.value) : e.target.value)}
      type={type}
      placeholder={placeholder}
    />
  }

type Props = {
  onSave: (EditIngredientPayload) => mixed,
  onCancel: () => mixed,
  onDelete: (groupId: string) => mixed,

  selectedWells: Array<string>,
  selectedWellsMaxVolume: number,
  commonSelectedIngred: ?string,
  commonSelectedVolume: ?number,

  allIngredientGroupFields: ?AllIngredGroupFields,
  allIngredientNamesIds: Array<{ingredientId: string, name: ?string}>,
}

type State = {
  input: IngredInputs,
  commonIngredGroupId: ?string,
  pristine: {[string]: boolean},
}

class IngredientPropertiesForm extends React.Component<Props, State> {
  Field: $Call<typeof makeInputField, *>

  constructor (props: Props) {
    super(props)
    this.state = {
      pristine: {
        name: true,
        volume: true,
      },
      input: {
        name: null,
        volume: null,
        description: null,
        individualize: false,
      },
      commonIngredGroupId: null,
    }

    // TODO: Ian 2018-06-07 don't use makeInputField or this.Field, it's weird & bad
    this.Field = makeInputField({
      setSubstate: (inputKey, inputValue: any) => { // TODO: Ian 2018-06-07 avoid any type here
        this.setState({
          input: {...this.state.input, [inputKey]: inputValue},
          commonIngredGroupId: (inputKey === 'name')
            ? null // unset commonIngredGroupId if user changes 'name' field
            : this.state.commonIngredGroupId,
        })
      },
      getSubstate: (inputKey) => this.state.input[inputKey],
    })
  }

  resetInputState = (
    ingredGroupId: ?string,
    nextIngredGroupFields: ?AllIngredGroupFields,
    cb?: SetStateCallback
  ) => {
    // with a valid ingredGroupId, reset fields to values from that group.
    // otherwise, clear all fields

    // nextIngredGroupFields allows you to update with nextProps
    const allIngredientGroupFields = (nextIngredGroupFields || this.props.allIngredientGroupFields || {})

    if (ingredGroupId && ingredGroupId in allIngredientGroupFields) {
      const {name, volume, description, individualize} = this.state.input
      const newIngredFields = allIngredientGroupFields[ingredGroupId]
      this.setState({
        ...this.state,
        input: {
          name: newIngredFields.name || name,
          volume: newIngredFields.volume || volume,
          description: newIngredFields.description || description,
          individualize: newIngredFields.individualize || individualize,
        },
      }, cb)
    } else {
      // No/invalid ingredGroupId, set inputs to "blank" state
      this.setState({
        ...this.state,
        pristine: {
          name: true,
          volume: true,
        },
        input: {
          name: null,
          volume: null,
          description: null,
          individualize: false,
        },
      }, cb)
    }
  }

  // TODO(mc, 2018-07-24): use a different lifecycle hook
  componentWillReceiveProps (nextProps: Props) {
    const nextEditingId = nextProps.commonSelectedIngred
    const prevEditingId = this.props.commonSelectedIngred

    const wellSelectionCleared = nextProps.selectedWells.length === 0
    const ingredsChanged = nextEditingId !== prevEditingId
    const volumeChanged = nextProps.commonSelectedVolume !== this.props.commonSelectedVolume

    if (ingredsChanged || volumeChanged || wellSelectionCleared) {
      this.resetInputState(nextEditingId, nextProps.allIngredientGroupFields, () => this.setState({
        ...this.state,
        input: {
          ...this.state.input,
          volume: nextProps.commonSelectedVolume,
        },
        commonIngredGroupId: nextEditingId,
      }))
    }
  }

  selectExistingIngred = (ingredGroupId: string) => {
    // Used to populate ingred fields from dropdown
    this.resetInputState(ingredGroupId, undefined, () => this.setState({
      ...this.state,
      commonIngredGroupId: ingredGroupId,
    }))
  }

  handleDelete = (e: SyntheticEvent<*>) => {
    const {onDelete} = this.props

    const groupToDelete = null // TODO: Ian 2018-06-07 allow deleting ingreds
    if (groupToDelete) {
      window.confirm('Are you sure you want to delete all ingredients in this group?') &&
        onDelete(groupToDelete)
    } else {
      console.warn('Tried to delete in IngredientPropertiesForm, with no groupId to delete!')
    }
  }

  getFieldErrors: () => FieldErrors = () => {
    const {name, volume} = this.state.input
    const {selectedWellsMaxVolume} = this.props

    let errors: FieldErrors = {}

    if (!(volume && volume > 0)) {
      errors.volume = 'Must be more than 0'
    } else if (selectedWellsMaxVolume < volume) {
      errors.volume = `Warning: exceeded max volume per well: ${selectedWellsMaxVolume}µL`
    }

    if (!name) {
      errors.name = 'This field is required'
    }

    return errors
  }

  handleSave: () => mixed = () => {
    // dirty all fields
    this.setState({pristine: mapValues(this.state.pristine, () => false)}, () => {
      const formIsValid = Object.values(this.getFieldErrors()).length === 0

      if (formIsValid) {
        // actually save only when valid
        this.props.onSave({
          ...this.state.input,
          groupId: this.state.commonIngredGroupId,
        })
      }
    })
  }

  render () {
    const {
      onCancel,
      allIngredientNamesIds,
      selectedWells,
      selectedWellsMaxVolume,
    } = this.props

    const {commonIngredGroupId} = this.state

    const Field = this.Field // ensures we don't lose focus on input re-render during typing

    // mask pristine errors
    const visibleErrors = mapValues(
      this.getFieldErrors(),
      (errMsg: ?string, fieldName: string): ?string =>
        this.state.pristine[fieldName] ? null : errMsg
      )

    const showIngredientDropdown = allIngredientNamesIds.length > 0
    const showForm = selectedWells.length > 0

    const ingredDropdownLabel = commonIngredGroupId
      ? 'Replace With:'
      : 'Pick Existing:'

    if (!showForm) {
      return null
    }

    return (
      <div className={formStyles.form}>
        <form className={styles.form_content}>
          <div className={formStyles.row_wrapper}>
              <FormGroup label='Liquid title:' className={styles.ingred_title_field}>
                <Field
                  error={visibleErrors.name}
                  accessor='name'
                />
              </FormGroup>

              <FormGroup
                label={'\u00A0'} // non-breaking space
                className={styles.individualize}
              >
                <Field
                  label='Serialize'
                  accessor='individualize'
                  type='checkbox'
                />
              </FormGroup>

            {showIngredientDropdown && <FormGroup label={ingredDropdownLabel} className={styles.existing_ingred_field}>
              <DropdownField
                value={commonIngredGroupId || ''}
                onChange={(e: SyntheticInputEvent<*>) => this.selectExistingIngred(e.target.value)}
                options={[
                  {name: '', value: ''},
                  ...allIngredientNamesIds.map(({ingredientId, name}) => ({
                    name: name || `(unnamed: ${ingredientId})`,
                    value: ingredientId,
                  })),
                ]}
              />
            </FormGroup>}
          </div>

          <div className={formStyles.row_wrapper}>
            <FormGroup label='Volume:' className={styles.volume_field}>
              <Field
                numeric
                accessor='volume'
                units='µL'
                caption={Number.isFinite(selectedWellsMaxVolume)
                  ? `max ${selectedWellsMaxVolume}`
                  : null}
                error={visibleErrors.volume}
              />
            </FormGroup>
          </div>

          <div className={formStyles.row_wrapper}>
            <FormGroup label='Description:' className={styles.description_field}>
              <Field accessor='description' />
            </FormGroup>
          </div>
        </form>

        <div className={styles.button_row}>
          <PrimaryButton onClick={onCancel}>Cancel</PrimaryButton>

          <PrimaryButton
            onClick={this.handleSave}
          >
            Save
          </PrimaryButton>

          {/* TODO: Ian 2018-06-07 allow deleting ingreds,
            * waiting on ticket (clear selected wells vs delete
            * ingred group across all labware behavior? both?)
          */}
          {/* editMode &&
            <PrimaryButton onClick={this.handleDelete}>
              Delete Ingredient
            </PrimaryButton>
          */}
        </div>
      </div>
    )
  }
}

export default IngredientPropertiesForm
