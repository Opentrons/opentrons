import React from 'react'
import get from 'lodash/get'

import styles from './IngredientsList.css'
import { swatchColors } from '../constants.js'
import { humanize } from '../utils.js'

class IngredGroupCard extends React.Component {
  constructor (props) {
    super(props)
    this.state = {isExpanded: true}
  }

  toggleAccordion = () => this.setState({isExpanded: !this.state.isExpanded})

  render () {
    const {ingredCategoryData, editModeIngredientGroup, deleteIngredient, selected, ...otherProps} = this.props
    const { groupId } = ingredCategoryData
    const { isExpanded } = this.state

    return (
      <section {...otherProps} className={selected && styles.selected}>
        <label>
          <div onClick={() => this.toggleAccordion()} className={styles.arrowDropdown}>{isExpanded ? '▼' : '►'}</div>
          <div className={styles.circle} style={{backgroundColor: swatchColors(groupId)}} />
          <div className={styles.ingredLabel}>{ingredCategoryData.name}</div>
          {/* <div>{ingredCategoryData.wells.length} Wells</div> */}
          <div className={styles.editButton} onClick={e => editModeIngredientGroup({groupId})}>EDIT</div>
        </label>

        {isExpanded && ingredCategoryData.wells.map((wellName, i) =>
          <IngredIndividual key={i}
            name={ingredCategoryData.individualize
              ? get(ingredCategoryData, ['wellDetails', wellName, 'name'], `Sample ${i + 1}`)
              : ' '
            }
            wellName={wellName}
            canDelete
            volume={get(ingredCategoryData, ['wellDetails', wellName, 'volume'], ingredCategoryData.volume)}
            concentration={get(ingredCategoryData, ['wellDetails', wellName, 'concentration'], ingredCategoryData.concentration)}
            {...{groupId, editModeIngredientGroup, deleteIngredient}}
          />
        )}
      </section>
    )
  }
}

const IngredIndividual = ({name, wellName, volume, concentration, canDelete, groupId, editModeIngredientGroup, deleteIngredient, ...otherProps}) => (
  <div {...otherProps}
    className={styles.ingredientInstanceItem}
    style={{'--swatch-color': swatchColors(groupId)}}
  >
    <div>{wellName}</div>
    <div>{name}</div>
    <div>{volume + 'uL'}</div>
    {/* <button className={styles.editButton} onClick={e => editModeIngredientGroup({wellName, groupId})}>EDIT</button> */}
    <div>{concentration === null ? '-' : concentration + '%'}</div>
    {canDelete && <div className={styles.deleteIngredient} onClick={
        e => window.confirm(`Are you sure you want to delete well ${wellName} ?`) &&
        deleteIngredient({wellName, groupId})
      }>✕</div>}
  </div>
)

const IngredientsList = ({slotName, containerName, containerType, ingredients, editModeIngredientGroup, deleteIngredient, selectedIngredientGroupId}) => (
  <div className={styles.ingredientsList}>
    <div className={styles.ingredListHeaderLabel}>
      <div className={styles.flexRow}>
        <div>Slot {slotName}</div>
        <div className={styles.containerType}>{humanize(containerType)}</div>
      </div>
      <div className={styles.containerName}>{containerName}</div>
    </div>

    {ingredients.map((ingredCategoryData, i) =>
      <IngredGroupCard key={i} {...{
        editModeIngredientGroup,
        deleteIngredient,
        ingredCategoryData,
        selected: selectedIngredientGroupId === ingredCategoryData.groupId
      }} />)
    }

  </div>
)

export default IngredientsList
