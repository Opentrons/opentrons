import React from 'react'
import PropTypes from 'prop-types'
import styles from './IngredientPropertiesForm.css'

import Button from './Button.js'

const makeInputField = ({setSubstate, getSubstate}) => ({accessor, numeric, ...otherProps}) => {
  const ElementType = (otherProps.type === 'textarea')
    ? 'textarea'
    : 'input'

  return <ElementType
    id={accessor}
    checked={otherProps.type === 'checkbox' && getSubstate(accessor) === true}
    value={getSubstate(accessor) || ''} // getSubstate = (inputKey) => stateOfThatKey
    onChange={e => otherProps.type === 'checkbox'
      ? setSubstate(accessor, !getSubstate(accessor))
      : setSubstate(accessor, numeric ? parseFloat(e.target.value) : e.target.value)} // setSubstate = (inputKey, inputValue) => {...}
    {...otherProps}
  />
}

class IngredientPropertiesForm extends React.Component {
  constructor (props) {
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
      }
    }

    this.Field = makeInputField({
      setSubstate: (inputKey, inputValue) => {
        this.setState({input: {...this.state.input, [inputKey]: inputValue}})
      },
      getSubstate: inputKey => this.state.input[inputKey]
    })
  }

  componentWillReceiveProps (nextProps) {
    const { name, volume, description, concentration, individualize, serializeName } = this.state.input

    if (!nextProps.selectedIngredientProperties) {
      this.setState({
        input: {
          name: null,
          volume: null,
          description: null,
          concentration: null,
          individualize: false,
          serializeName: null
        }
      })
    } else {
      this.setState({
        input: {
          name: nextProps.selectedIngredientProperties.name || name,
          volume: nextProps.selectedIngredientProperties.volume || volume,
          description: nextProps.selectedIngredientProperties.description || description,
          concentration: nextProps.selectedIngredientProperties.concentration || concentration,
          individualize: nextProps.selectedIngredientProperties.individualize || individualize,
          serializeName: nextProps.selectedIngredientProperties.serializeName || serializeName
        }
      })
    }
  }

  render () {
    const { numWellsSelected, onSave, onCancel, onDelete, selectedIngredientProperties } = this.props
    const Field = this.Field // ensures we don't lose focus on input re-render during typing

    if (!selectedIngredientProperties && numWellsSelected <= 0) {
      return (
        // TODO: style this properly
        <div style={{margin: '0 20%'}}>
          <Button style={{color: 'gray'}} disabled>
            Select Wells to Add an Ingredient
          </Button>
          <div style={{textAlign: 'center', color: 'white', 'paddingTop': '1rem'}}>
            You can select multiple wells by dragging your mouse or holding shift.
          </div>
        </div>
      )
    }

    return (
      <div className={styles.ingredientPropertiesEntry}>
        <h1>
          <div>Ingredient Properties</div>
          <div>{numWellsSelected} Well(s) Selected</div>
        </h1>

        <form>
          <div className={styles.flexRow}>
            <span>
              <label>Name</label>
              <Field accessor='name' />
            </span>
            <span>
              <span className={styles.checkbox}>
                <label> Serialize Name </label>
                <Field accessor='individualize' type='checkbox' />
              </span>
              {this.state.input.individualize && <Field accessor='serializeName' placeholder='Sample' />}
            </span>
          </div>
          <div className={styles.middleRow}>
            <span>
              <label>Volume (µL)</label>
              <Field numeric accessor='volume' />
            </span>
            <span>
              <label>Concentration</label>
              <Field numeric accessor='concentration' />
            </span>
            <span className={styles.serializeNameExample}>(ie Sample 1, Sample 2, Sample 3, ...)</span>
          </div>
          <div className={styles.flexRow}>
            <span>
              <label>Description</label>
              <Field accessor='description' type='textarea' />
            </span>
          </div>
        </form>

        {/* selectedIngredientProperties &&
          <div><label>Editing: "{selectedIngredientProperties.name}"</label></div> */}

        {/* <span>
          <label>Color Swatch</label>
          <div className={styles.circle} style={{backgroundColor: 'red'}} />
        </span> */}
        <div className={styles.buttonRow}>
          <Button /* disabled={TODO: validate input here} */ onClick={e => onSave(this.state.input)}>Save</Button>
          <Button onClick={onCancel}>Cancel</Button>
          {selectedIngredientProperties && selectedIngredientProperties.groupId &&
            <Button className={styles.deleteIngred} onClick={() =>
              window.confirm('Are you sure you want to delete all ingredients in this group?') &&
              onDelete(selectedIngredientProperties.groupId)
            }>Delete Ingredient</Button>
          }
        </div>
      </div>
    )
  }
}

IngredientPropertiesForm.propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  numWellsSelected: PropTypes.number.isRequired,

  selectedIngredientProperties: PropTypes.shape({
    name: PropTypes.string,
    volume: PropTypes.number,
    description: PropTypes.string,
    groupId: PropTypes.string
  })
}

export default IngredientPropertiesForm
