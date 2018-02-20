// @flow
import * as React from 'react'
import styles from './IngredientPropertiesForm.css'

import Button from './Button.js'

type SetSubstate = (accessor: string, value: string | boolean | number) => any
type GetSubstate = (accessor: string) => string | boolean

type FieldProps = {
  accessor: string,
  numeric?: boolean,
  type?: string
}

const makeInputField = (args: {setSubstate: SetSubstate, getSubstate: GetSubstate}) =>
  (props: FieldProps) => { /* otherProps */
    const {setSubstate, getSubstate} = args
    const {accessor, numeric, ...otherProps} = props

    const ElementType = (otherProps.type === 'textarea')
      ? 'textarea'
      : 'input'

    return <ElementType
      id={accessor}
      checked={otherProps.type === 'checkbox' && getSubstate(accessor) === true}
      value={getSubstate(accessor) || ''} // getSubstate = (inputKey) => stateOfThatKey
      onChange={(e: SyntheticInputEvent<HTMLInputElement>) => otherProps.type === 'checkbox'
        ? setSubstate(accessor, !getSubstate(accessor))
        : setSubstate(accessor, numeric ? parseFloat(e.target.value) : e.target.value)} // setSubstate = (inputKey, inputValue) => {...}
      {...otherProps}
    />
  }

type SetStateCallback = (...args: Array<any>) => any

type IngredInputs = {
  groupId?: number,

  name: string | null,
  volume: number | null,
  description: string | null,
  concentration: string | null,
  individualize: boolean,
  serializeName: string | null
}

type AllIngredGroupFields = {
  [ingredGroupId: string]: IngredInputs
}

type Props = {
  onSave: any,
  onCancel: any,
  onDelete: any,
  numWellsSelected: number,
  selectedWellsMaxVolume: number,

  selectedIngredientProperties: {
    name: string,
    volume: number,
    description: string,
    groupId: number
  },

  allIngredientGroupFields: ?AllIngredGroupFields,
  allIngredientNamesIds: Array<{ingredientId: number, name: string}>,
  editingIngredGroupId: number // TODO change ids to strings
} & IngredInputs

type State = {
  input: IngredInputs,
  copyGroupId: ?number
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

  resetInputState = (ingredGroupId: number, nextIngredGroupFields: ?AllIngredGroupFields, cb?: SetStateCallback) => {
    // with a valid ingredGroupId, reset fields to values from that group.
    // otherwise, clear all fields

    // nextIngredGroupFields allows you to update with nextProps
    const allIngredientGroupFields = (nextIngredGroupFields || this.props.allIngredientGroupFields || {})

    if (ingredGroupId in allIngredientGroupFields) {
      const { name, volume, description, concentration, individualize, serializeName } = this.state.input
      const newIngredFields = allIngredientGroupFields[ingredGroupId.toString()] // TODO access with string, not number
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

  selectExistingIngred = (ingredGroupId: number) => {
    this.resetInputState(ingredGroupId, undefined, () => this.setState({...this.state, copyGroupId: ingredGroupId}))
  }

  render () {
    const {
      numWellsSelected,
      onSave,
      onCancel,
      onDelete,
      allIngredientNamesIds,
      allIngredientGroupFields,
      editingIngredGroupId,
      selectedWellsMaxVolume
    } = this.props

    const selectedIngredientFields = allIngredientGroupFields && allIngredientGroupFields[editingIngredGroupId.toString()]
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
      <div className={styles.ingredient_properties_entry}>
        <h1>
          <div>Ingredient Properties</div>
          <div>{numWellsSelected} Well(s) Selected</div>
        </h1>

        <form>
          <div className={styles.middle_row}>
            <span className={styles.two_thirds}>
              <label>Name</label>
              <Field accessor='name' />
            </span>
            {!editMode && <span>
              {/* TODO make this a Field??? */}
              <select onChange={(e: SyntheticInputEvent<*>) => this.selectExistingIngred(parseInt(e.target.value, 10))}>
                <option value=''>Select existing ingredient</option>
                {allIngredientNamesIds.map(({ingredientId, name}, i) =>
                  <option key={i} value={ingredientId}>{name}</option>
                )}
              </select>
            </span>}
          </div>
          <div className={styles.middle_row}>
            <span>
              <span className={styles.checkbox}>
                <Field accessor='individualize' type='checkbox' />
                <label> Serialize Name </label>
              </span>
              {individualize && <Field accessor='serializeName' placeholder='Sample' />}
            </span>
            <span className={styles.serialize_name_example}>(ie Sample 1, Sample 2, Sample 3, ...)</span>
          </div>
          <div className={styles.middle_row}>
            <span style={{borderColor: maxVolExceeded && 'red'}}>
              <label>Volume (µL)</label>
              {maxVolExceeded && // TODO: clean up the styling for this
                <label style={{color: 'red'}}>
                  Warning: exceeded max volume per well: {selectedWellsMaxVolume}uL
                </label>}
              <Field numeric accessor='volume' />
            </span>
            <span>
              <label>Concentration</label>
              <Field accessor='concentration' />
            </span>
          </div>
          <div className={styles.flex_row}>
            <span>
              <label>Description</label>
              <Field accessor='description' type='textarea' />
            </span>
          </div>
        </form>

        {/* editMode &&
          <div><label>Editing: "{selectedIngredientFields.name}"</label></div> */}

        {/* <span>
          <label>Color Swatch</label>
          <div className={styles.circle} style={{backgroundColor: 'red'}} />
        </span> */}
        <div className={styles.button_row}>
          <Button /* disabled={TODO: validate input here} */
            onClick={e => onSave({...this.state.input, copyGroupId: this.state.copyGroupId})}
          >
            Save
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
          {editMode &&
            <Button className={styles.delete_ingred} onClick={() =>
              window.confirm('Are you sure you want to delete all ingredients in this group?') &&
              onDelete(selectedIngredientFields && selectedIngredientFields.groupId)
            }>Delete Ingredient</Button>
          }
        </div>
      </div>
    )
  }
}

export default IngredientPropertiesForm
