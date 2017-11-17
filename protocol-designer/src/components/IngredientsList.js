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
    const { groupId, serializeName } = ingredCategoryData
    const { isExpanded } = this.state

    return (
      <section {...otherProps} className={selected && styles.selected}>
        <label>
          <div onClick={() => this.toggleAccordion()} className={styles.arrow_dropdown}>{isExpanded ? '▼' : '►'}</div>
          <div className={styles.circle} style={{backgroundColor: swatchColors(groupId)}} />
          <div className={styles.ingred_label}>{ingredCategoryData.name}</div>
          {/* <div>{ingredCategoryData.wells.length} Wells</div> */}
          <div className={styles.edit_button} onClick={e => editModeIngredientGroup({groupId})}>EDIT</div>
        </label>

        {isExpanded && ingredCategoryData.wells.map((wellName, i) =>
          <IngredIndividual key={i}
            name={ingredCategoryData.individualize
              ? get(ingredCategoryData, ['wellDetails', wellName, 'name'], `${serializeName || 'Sample'} ${i + 1}`)
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

function IngredIndividual ({name, wellName, volume, concentration, canDelete, groupId, editModeIngredientGroup, deleteIngredient, ...otherProps}) {
  return (
    <div {...otherProps}
      className={styles.ingredient_instance_item}
      style={{'--swatch-color': swatchColors(groupId)}}
    >
      <div>{wellName}</div>
      <div>{name}</div>
      <div>{volume ? volume + 'uL' : '-'}</div>
      {/* <button className={styles.edit_button} onClick={e => editModeIngredientGroup({wellName, groupId})}>EDIT</button> */}
      <div>{concentration === null ? '-' : concentration}</div>
      {canDelete && <div className={styles.delete_ingredient} onClick={
          e => window.confirm(`Are you sure you want to delete well ${wellName} ?`) &&
          deleteIngredient({wellName, groupId})
        }>✕</div>}
    </div>
  )
}

export default function IngredientsList ({slotName, containerName, containerType, ingredients, editModeIngredientGroup, deleteIngredient, selectedIngredientGroupId}) {
  return (
    <div className={styles.ingredients_list}>
      <div className={styles.ingred_list_header_label}>
        <div className={styles.flex_row}>
          <div>Slot {slotName}</div>
          <div className={styles.container_type}>{humanize(containerType)}</div>
        </div>
        <div className={styles.container_name}>{containerName}</div>
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
}
