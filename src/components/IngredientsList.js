import React from 'react'
import get from 'lodash/get'

import styles from './IngredientsList.css'
import { swatchColors } from '../constants.js'
import { humanize } from '../utils.js'

const IngredGroupCard = ({ingredCategoryData, editModeIngredientGroup, deleteIngredientGroup, ...otherProps}) => {
  const { groupId } = ingredCategoryData

  if (ingredCategoryData.wells.length === 1) {
    // Single ingredient, card is rendered differently
    return (
      <div className={styles.singleIngred} >
        <IngredIndividual
          canDelete
          name={ingredCategoryData.name}
          wellName={ingredCategoryData.wells[0]}
          volume={ingredCategoryData.volume}
          concentration={ingredCategoryData.concentration}
          {...{groupId, editModeIngredientGroup, deleteIngredientGroup}}
          {...otherProps} />
      </div>
    )
  }

  return (
    <section>
      <label>
        <div className={styles.circle} style={{backgroundColor: swatchColors(groupId)}} />
        <div className={styles.ingredLabel}>{ingredCategoryData.name}</div>
        <div>{ingredCategoryData.wells.length} Wells</div>
      </label>

      {ingredCategoryData.individualize
          // Is individualize, allow 'wellDetails' values to override
          ? ingredCategoryData.wells.map((wellName, i) =>
            <IngredIndividual key={i}
              name={get(ingredCategoryData, ['wellDetails', wellName, 'name'], `Sample ${i + 1}`)}
              wellName={wellName}
              volume={get(ingredCategoryData, ['wellDetails', wellName, 'volume'], ingredCategoryData.volume)}
              concentration={get(ingredCategoryData, ['wellDetails', wellName, 'concentration'], ingredCategoryData.concentration)}
              {...{groupId, editModeIngredientGroup, deleteIngredientGroup}}
            />
          )
          // Not individualize, but multiple wells
          : <div className={styles.ingredientInlineDetail}>
            {ingredCategoryData.wells.map((wellName, i) =>
              <div key={i}>
                <label>{wellName}</label>
                <input placeholder={ingredCategoryData.volume + ' uL'} />
              </div>
            )}
          </div>
      }

      <footer>
        <div className={styles.editButton} onClick={e => editModeIngredientGroup({groupId})}>EDIT</div>
        <div>▼</div>
        <div className={styles.deleteIngredient} onClick={e => deleteIngredientGroup({groupId})}>✕</div>
      </footer>
    </section>
  )
}

const IngredIndividual = ({name, wellName, volume, concentration, canDelete, groupId, editModeIngredientGroup, deleteIngredientGroup, ...otherProps}) => (
  <div {...otherProps}
    className={styles.ingredientInstanceItem}
    style={{'--swatch-color': swatchColors(groupId)}}
  >
    <div className={styles.leftPill}>
      <label>{name}</label>
      <button className={styles.editButton} onClick={e => editModeIngredientGroup({wellName, groupId})}>EDIT</button>
    </div>
    <div className={styles.rightPill}>
      <input placeholder={wellName} />
      <input placeholder={volume + ' uL'} />
      <input placeholder={concentration === null ? '-' : concentration + '%'} />
      {canDelete && <div className={styles.deleteIngredient} onClick={e => deleteIngredientGroup({wellName, groupId})}>✕</div>}
    </div>
  </div>
)

const IngredientsList = ({slotName, containerName, containerType, ingredients, editModeIngredientGroup, deleteIngredientGroup}) => (
  <div className={styles.ingredientsList}>
    <div className={styles.ingredListHeaderLabel}>
      <div>Slot {slotName}</div>
      <div>{containerName}</div>
    </div>
    <div>
      {/* TODO: use display container type, not '96-flat' */}
      <div>{humanize(containerType)}</div>
    </div>

    {ingredients.map((ingredCategoryData, i) =>
      <IngredGroupCard key={i} {...{editModeIngredientGroup, deleteIngredientGroup, ingredCategoryData}} />)
    }

  </div>
)

export default IngredientsList
