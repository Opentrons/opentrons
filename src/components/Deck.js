import React from 'react'
// import cx from 'classnames'

import { slotnames } from '../constants.js'
import styles from '../css/style.css'

import SelectablePlate from '../containers/SelectablePlate.js'
import IngredientsList from './IngredientsList.js'

const AddLabware = props => (
  <div
    {...props}
    className={styles.addLabware}>
      Add Labware
  </div>
)

// TODO: move to utils
const getImg = containerName => {
  const getUrl = imageFileName => `https://s3.amazonaws.com/opentrons-images/website/labware/${imageFileName}.png`

  const plates96 = [
    '96-deep',
    '96-tall',
    '96-flat'
  ]

  const noImage = [
    '96-custom',
    'PCR-strip-tall'
  ]

  if (plates96.some(x => x === containerName)) {
    return getUrl('96-plate')
  }

  if (noImage.some(x => x === containerName)) {
    return getUrl('custom')
  }

  return getUrl(containerName)
}

const DeckSlot = ({slotName, container, children, onAddIngredientsClick, onRemoveContainerClick}) => (
  <div className={styles.deckSlot}>
    {container
      ? <img src={getImg(container)} />
      : <label>{slotName}</label>}

    {container &&
      <div className={styles.containerOverlay}>
        <div className={styles.containerOverlayAddIngred} onClick={onAddIngredientsClick}>
          Add Ingredients
        </div>
        <div className={styles.containerOverlayRemove} onClick={onRemoveContainerClick}>
          Remove {container}
        </div>
      </div>}

    {children}
  </div>
)

class Accordion extends React.Component {
  constructor (props) {
    super(props)
    this.state = {collapsed: true}
  }
  render () {
    const { children, title } = this.props
    const { collapsed } = this.state
    return (
      <li onClick={e => this.setState({collapsed: !collapsed})}>
        <label>{title} {collapsed ? '►' : '▼'}</label>
        {!collapsed && <li><ul>
          {children}
        </ul></li>}
      </li>
    )
  }
}

const LabwareDropdown = ({onClose, selectLabwareToAdd}) => (
  <div className={styles.labwareDropdown}>
    <label>Labware Type</label>
    <div className='close' onClick={onClose}>X</div>
    <ul>
      <Accordion title='Tip Rack'>
        <li onClick={e => selectLabwareToAdd('tiprack-10ul')}>10uL Tip Rack</li>
        <li onClick={e => selectLabwareToAdd('tiprack-200ul')}>200uL Tip Rack</li>
        <li onClick={e => selectLabwareToAdd('tiprack-1000ul')}>1000uL Tip Rack</li>
        <li onClick={e => selectLabwareToAdd('tiprack-1000ul-chem')}>10x10 1000uL Chem-Tip Rack</li>
      </Accordion>
      <Accordion title='Tube Rack'>
        <li onClick={e => selectLabwareToAdd('tube-rack-.75ml')}>0.75mL Tube Rack</li>
        <li onClick={e => selectLabwareToAdd('tube-rack-2ml')}>2mL Tube Rack</li>
        <li onClick={e => selectLabwareToAdd('tube-rack-15_50ml')}>15mL x 6 + 50mL x 4 Tube Rack</li>
      </Accordion>
      <Accordion title='Well Plate'>
        <li onClick={e => selectLabwareToAdd('96-deep')}>96 Deep Well Plate</li>
        <li onClick={e => selectLabwareToAdd('96-tall')}>96 Well Plate (Tall)</li>
        <li onClick={e => selectLabwareToAdd('96-flat')}>96 Well Plate (Flat)</li>
        <li onClick={e => selectLabwareToAdd('96-custom')}>96 Well Plate (CUSTOM)</li>
        <li onClick={e => selectLabwareToAdd('384-plate')}>384 Well Plate</li>
      </Accordion>
      <Accordion title='Trough'>
        <li onClick={e => selectLabwareToAdd('trough-12row')}>12-row Trough</li>
      </Accordion>
      <Accordion title='PCR Strip'>
        <li onClick={e => selectLabwareToAdd('PCR-strip-tall')}>PCR Strip Tall</li>
      </Accordion>
      <Accordion title='Trash'>
        <li onClick={e => selectLabwareToAdd('trash-box')}>Trash Box</li>
      </Accordion>
    </ul>
  </div>
)

const Deck = props => {
  const {
    loadedContainers,
    canAdd,
    activeModals,
    openIngredientSelector,
    closeIngredientSelector,
    deleteContainerAtSlot,
    openLabwareSelector,
    closeLabwareSelector,
    selectLabwareToAdd } = props

  return (
    <div className={styles.deck}>
      {activeModals.ingredientSelection &&
        <div className={styles.ingredientModal}>

          <div className={styles.ingredientPanelSidebar}>
            <IngredientsList
              slotName={activeModals.ingredientSelection.slotName}
              containerName={activeModals.ingredientSelection.containerName} />
          </div>

          <div className={styles.ingredientPanelContent}>
            <div className={styles.containerDetail}>
              <SelectablePlate />
            </div>

            {/* <button>Add Ingredient</button> */}
            {/* TODO:  ^^^ Add button back in conditionally */}
            <div className={styles.ingredientPropertiesEntry}>
              <h1>
                <div>Ingredient Properties</div>
                <div>(TODO) Well(s) Selected</div>
              </h1>
              <form>
                <span>
                  <label>Name</label>
                  <input />
                </span>
                <span>
                  <label>Volume</label> (µL)
                  <input />
                </span>
                <span>
                  <label>Description</label>
                  <textarea />
                </span>
              </form>
              <div className={styles.ingredientPropRightSide}>
                <span>
                  <label>Color Swatch</label>
                  <div className={styles.circle} style={{backgroundColor: 'red'}} />
                </span>
                <button>Save</button>
                <button>Cancel</button>
              </div>
            </div>
          </div>
          <div className='close' onClick={e => closeIngredientSelector()}>⟳</div>
        </div>
      }
      {slotnames.map((slotName, i) =>
        <DeckSlot
          key={i}
          slotName={slotName}
          container={loadedContainers[slotName]}
          onAddIngredientsClick={e => openIngredientSelector({slotName})}
          onRemoveContainerClick={e => deleteContainerAtSlot(slotName)}
        >
          {(slotName === canAdd) && (activeModals.labwareSelection
            ? <LabwareDropdown
              onClose={e => closeLabwareSelector({slotName})}
              selectLabwareToAdd={selectLabwareToAdd}
            />
            : <AddLabware onClick={e => openLabwareSelector({slotName})} />
          )}
        </DeckSlot>
      )}
    </div>
  )
}

export default Deck
