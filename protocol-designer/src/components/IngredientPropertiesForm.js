// @flow
import * as React from 'react'
import isNil from 'lodash/isNil'
import {
  FlatButton,
  PrimaryButton,
  CheckboxField,
  DropdownField,
  InputField
} from '@opentrons/components'

import styles from './IngredientPropertiesForm.css'
import formStyles from './Form.css'

type SetStateCallback = (...args: Array<*>) => *

type IngredInputs = {
  groupId?: string,

  name: string | null,
  volume: number | null,
  description: string | null,
  concentration: string | null,
  individualize: boolean,
  serializeName: string | null
}

// type Accessor = $Keys<IngredInputs>
type Accessor =
  | 'name'
  | 'volume'
  | 'description'
  | 'concentration'
  | 'individualize'
  | 'serializeName'

type AllIngredGroupFields = {
  [ingredGroupId: string]: IngredInputs
}

type SetSubstate = (accessor: string, value: string | boolean | number) => mixed
type GetSubstate = (accessor: Accessor) => string | boolean | number | null

type FieldProps = {|
  accessor: Accessor,
  numeric?: boolean,
  type?: string,
  label?: string,
  units?: string,
  error?: string,
  placeholder?: string
|}

const makeInputField = (args: {setSubstate: SetSubstate, getSubstate: GetSubstate}) =>
  (props: FieldProps) => { /* otherProps */
    const {setSubstate, getSubstate} = args
    const {accessor, numeric, type, placeholder} = props

    if (!type || type === 'input') {
      return <InputField
        label={props.label}
        units={props.units}
        error={props.error}
        value={(getSubstate(accessor) || '').toString()}
        onChange={(e: SyntheticInputEvent<HTMLInputElement>) =>
          setSubstate(accessor, numeric ? parseFloat(e.target.value) : e.target.value)
        }
      />
    }

    if (type === 'checkbox') {
      return <CheckboxField
        label={props.label}
        value={getSubstate(accessor) === true}
        onChange={(e: SyntheticInputEvent<*>) => setSubstate(accessor, !getSubstate(accessor))}
      />
    }

    // TODO Ian 2018-02-21 make Textbox component and get rid of this
    const ElementType = (type === 'textarea')
      ? 'textarea'
      : 'input'

    return <ElementType
      id={accessor}
      value={getSubstate(accessor) || ''}
      onChange={(e: SyntheticInputEvent<HTMLInputElement>) =>
        setSubstate(accessor, numeric ? parseFloat(e.target.value) : e.target.value)}
      type={type}
      placeholder={placeholder}
    />
  }

type Props = {
  onSave: ({copyGroupId: ?string} & IngredInputs) => void,
  onCancel: () => void,
  onDelete: (groupId: string) => void,
  numWellsSelected: number,
  selectedWellsMaxVolume: number,

  selectedIngredientProperties: {
    name: string,
    volume: number,
    description: string,
    groupId: string
  },

  allIngredientGroupFields: ?AllIngredGroupFields,
  allIngredientNamesIds: Array<{ingredientId: string, name: string}>,
  editingIngredGroupId: string
} & IngredInputs

type State = {
  input: IngredInputs,
  copyGroupId: ?string
}

class IngredientPropertiesForm extends React.Component<Props, State> {
  Field: $Call<typeof makeInputField, *>

  constructor (props: Props) {
    super(props)
    this.state = {
      input: {
        name: this.props.name || null,
        volume: this.props.volume || null,
        description: this.props.description || null,
        concentration: this.props.concentration || null,
        individualize: this.props.individualize || false,
        serializeName: this.props.individualize
          ? this.props.serializeName || this.props.name || null
          : null
      },
      copyGroupId: null
    }

    this.Field = makeInputField({
      setSubstate: (inputKey, inputValue) => {
        this.setState({...this.state, input: {...this.state.input, [inputKey]: inputValue}})
      },
      getSubstate: (inputKey) => this.state.input[inputKey]
    })
  }

  resetInputState = (ingredGroupId: string, nextIngredGroupFields: ?AllIngredGroupFields, cb?: SetStateCallback) => {
    // with a valid ingredGroupId, reset fields to values from that group.
    // otherwise, clear all fields

    // nextIngredGroupFields allows you to update with nextProps
    const allIngredientGroupFields = (nextIngredGroupFields || this.props.allIngredientGroupFields || {})

    if (ingredGroupId in allIngredientGroupFields) {
      const { name, volume, description, concentration, individualize, serializeName } = this.state.input
      const newIngredFields = allIngredientGroupFields[ingredGroupId]
      this.setState({
        ...this.state,
        input: {
          name: newIngredFields.name || name,
          volume: newIngredFields.volume || volume,
          description: newIngredFields.description || description,
          concentration: newIngredFields.concentration || concentration,
          individualize: newIngredFields.individualize || individualize,
          serializeName: newIngredFields.serializeName || serializeName
        }
      }, cb)
    } else {
      // No/invalid ingredGroupId, set inputs to "blank" state
      this.setState({
        ...this.state,
        input: {
          name: null,
          volume: null,
          description: null,
          concentration: null,
          individualize: false,
          serializeName: null
        }
      }, cb)
    }
  }

  componentWillReceiveProps (nextProps: Props) {
    this.resetInputState(nextProps.editingIngredGroupId, nextProps.allIngredientGroupFields)
  }

  selectExistingIngred = (ingredGroupId: string) => {
    this.resetInputState(ingredGroupId, undefined, () => this.setState({...this.state, copyGroupId: ingredGroupId}))
  }

  handleDelete = (selectedIngredientFields: *) => (e: SyntheticEvent<*>) => {
    const {onDelete} = this.props

    const groupToDelete = selectedIngredientFields && selectedIngredientFields.groupId
    if (groupToDelete) {
      window.confirm('Are you sure you want to delete all ingredients in this group?') &&
        onDelete(groupToDelete)
    } else {
      console.warn('Tried to delete in IngredientPropertiesForm, with no groupId to delete!')
    }
  }

  render () {
    const {
      numWellsSelected,
      onSave,
      onCancel,
      allIngredientNamesIds,
      allIngredientGroupFields,
      editingIngredGroupId,
      selectedWellsMaxVolume
    } = this.props

    const selectedIngredientFields = allIngredientGroupFields && !isNil(editingIngredGroupId) && allIngredientGroupFields[editingIngredGroupId.toString()]
    const { volume, individualize } = this.state.input

    const editMode = selectedIngredientFields
    const addMode = !editMode && numWellsSelected > 0

    const maxVolExceeded = volume !== null && selectedWellsMaxVolume < volume
    const Field = this.Field // ensures we don't lose focus on input re-render during typing

    if (!editMode && !addMode) {
      // Don't show anything, we're not editing or adding
      return null
    }

    return (
      <div className={formStyles.form}> {/* Was: styles.ingredient_properties_entry */}
        <h1 className={styles.ingred_form_header}>
          <div>Ingredient Properties</div>
          <div>{numWellsSelected} Well(s) Selected</div>
        </h1>

        <form>
          <div className={formStyles.field_row}>
            <span className={formStyles.column_2_3}>
              <Field accessor='name' label='Name' />
            </span>
            {!editMode && <span>
              {/* TODO make this a Field??? */}
              <DropdownField
                onChange={(e: SyntheticInputEvent<*>) => this.selectExistingIngred(e.target.value)}
                options={[
                  {name: 'Select Existing Ingredient', value: ''},
                  ...allIngredientNamesIds.map(({ingredientId, name}) => ({
                    name,
                    value: ingredientId
                  }))
                ]}
              />
            </span>}
          </div>
          <div className={formStyles.field_row}>
              <span>
                <Field accessor='individualize' type='checkbox' label='Serialize Name' />
              </span>
              <span>
                {individualize && <Field accessor='serializeName' placeholder='Sample' />}
              </span>
          </div>
          <div className={formStyles.field_row}>
            <span>
              <Field numeric accessor='volume' label='Volume' units='µL'
                error={maxVolExceeded
                  ? `Warning: exceeded max volume per well: ${selectedWellsMaxVolume}µL`
                  : undefined}
              />
            </span>
            <span>
              {/* TODO Ian 2018-02-21 make TextareaField component and use here */}
              <label>Description</label>
              <Field accessor='description' type='textarea' />
            </span>
          </div>
        </form>

        <div className={styles.button_row}>
          <FlatButton /* disabled={TODO: validate input here} */
            onClick={() => onSave({...this.state.input, copyGroupId: this.state.copyGroupId})}
          >
            Save
          </FlatButton>
          <FlatButton onClick={onCancel}>Cancel</FlatButton>
          {editMode &&
            <PrimaryButton onClick={this.handleDelete(selectedIngredientFields)}>
              Delete Ingredient
            </PrimaryButton>
          }
        </div>
      </div>
    )
  }
}

export default IngredientPropertiesForm
