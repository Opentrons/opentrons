import React from 'react'
import styles from './IngredientsList.css'

const IngredGroupCard = ({title, children, swatchColor}) => (
  <section>
    <label>
      <div className={styles.circle} style={{backgroundColor: swatchColor}} />
      <div className={styles.ingredLabel}>{title}</div>
      <div>8 Wells</div>
    </label>

    {children}

    <footer>
      <div className={styles.editButton}>EDIT</div>
      <div>▼</div>
      <div className={styles.deleteIngredient}>✕</div>
    </footer>
  </section>
)

const IngredIndividual = ({name, canDelete, swatchColor, ...otherProps}) => (
  <div {...otherProps} className={styles.ingredientInstanceItem} style={{'--swatch-color': swatchColor}}>
    <div className={styles.leftPill}>
      <label>{name}</label>
      <button className={styles.editButton}>EDIT</button>
    </div>
    <div className={styles.rightPill}>
      <input placeholder='A1' />
      <input placeholder='20uL' />
      <input placeholder='0%' />
      {canDelete && <div className={styles.deleteIngredient}>✕</div>}
    </div>
  </div>
)

const IngredientsList = ({slotName, containerName, containerType}) => (
  <div className={styles.ingredientsList}>
    <div className={styles.ingredListHeaderLabel}>
      <div>Slot {slotName}</div>
      <div>Container {containerName}</div>
    </div>
    <div>
      <div>Type {containerType} TODO</div>
    </div>

    {/* Each section is a detail view of 1 ingredient */}
    <IngredGroupCard title='Blood Samples' swatchColor='dodgerblue'>
      {/* Ingred category 'individualized' */}
      <div className={styles.innerList}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i =>
          <IngredIndividual key={i} name={`Sample ${i}`} />
        )}
      </div>
    </IngredGroupCard>
    {/* Single ingred */}
    <div className={styles.singleIngred} >
      <IngredIndividual name='Control' swatchColor='red' canDelete />
    </div>
    {/* Ingred category not 'individualized' */}
    <IngredGroupCard title='Buffer' swatchColor='orange'>
      <div className={styles.ingredientInlineDetail}>
        {['A12', 'B12', 'C12', 'D12', 'E12', 'F12', 'G12', 'H12'].map(wellName =>
          <div>
            <label>{wellName}</label>
            <input placeholder='20' />
          </div>
        )}
      </div>
    </IngredGroupCard>

  </div>
)

export default IngredientsList
