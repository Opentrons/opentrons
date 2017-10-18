import React from 'react'
// import cx from 'classnames'

import { slotnames } from '../constants.js'
import styles from '../css/style.css'

import SelectablePlate from '../containers/SelectablePlate.js'
import IngredientsList from './IngredientsList.js'
import IngredientPropertiesForm from '../containers/IngredientPropertiesForm.js'

const AddLabware = props => (
  <div
    {...props}
    className={styles.addLabware}>
      Add Labware
  </div>
)

// TODO: use container component instead
const getPlateTopdownImg = containerName => {
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
      ? <img src={getPlateTopdownImg(container)} />
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
        {!collapsed && <ul>
          {children}
        </ul>}
      </li>
    )
  }
}

const LabwareItem = ({selectLabwareToAdd, containerType, containerImgUrl, displayName}) => (
  <li
    className={styles.labwareListItem}
    onClick={e => selectLabwareToAdd(containerType)}
    style={containerImgUrl && {'--image-url': `url(${containerImgUrl})`
    }}
  >
    {displayName}
  </li>
)

const LabwareDropdown = ({onClose, selectLabwareToAdd}) => {
  const labwareItemMapper = (item, key) => (
    <LabwareItem key={key}
      containerType={item[0]}
      displayName={item[1]}
      selectLabwareToAdd={selectLabwareToAdd}
      containerImgUrl={item.length >= 3 && `http://docs.opentrons.com/_images/${item[2]}.png`}
    />
  )

  return (
    <div className={styles.labwareDropdown}>
      <label>Labware Type</label>
      <div className='close' onClick={onClose}>X</div>
      <ul>
        <Accordion title='Tip Rack'>
          {[
            ['tiprack-10ul', '10uL Tip Rack', 'Tiprack-10ul'],
            ['tiprack-200ul', '200uL Tip Rack', 'Tiprack-200ul'],
            ['tiprack-1000ul', '1000uL Tip Rack', 'Tiprack-200ul'],
            ['tiprack-1000ul-chem', '10x10 1000uL Chem-Tip Rack', 'Tiprack-1000ul-chem']
          ].map(labwareItemMapper)}
        </Accordion>
        <Accordion title='Tube Rack'>
          {[
            ['tube-rack-.75ml', '0.75mL Tube Rack', 'Tuberack-075ml'],
            ['tube-rack-2ml', '2mL Tube Rack', 'Tuberack-2ml'],
            ['tube-rack-15_50ml', '15mL x 6 + 50mL x 4 Tube Rack', 'Tuberack-15-50ml']
          ].map(labwareItemMapper)}
        </Accordion>
        <Accordion title='Well Plate'>
          {[
            ['96-deep', '96 Deep Well Plate', '96-Deep-Well'],
            ['96-tall', '96 Well Plate (Tall)', '96-PCR-Tall'],
            ['96-flat', '96 Well Plate (Flat)', '96-PCR-Flatt'],
            ['96-custom', '96 Well Plate (CUSTOM)', '96-PCR-Flatt'],
            ['384-plate', '384 Well Plate', '384-plate']
          ].map(labwareItemMapper)}
        </Accordion>
        <Accordion title='Trough'>
          {[
            ['trough-12row', '12-row Trough', 'Trough-12row']
          ].map(labwareItemMapper)}
        </Accordion>
        <Accordion title='PCR Strip'>
          {[
            ['PCR-strip-tall', 'PCR Strip Tall', '96-PCR-Strip']
          ].map(labwareItemMapper)}
        </Accordion>
        <Accordion title='Trash'>
          {[
            ['trash-box', 'Trash Box']
          ].map(labwareItemMapper)}
        </Accordion>
      </ul>
    </div>
  )
}

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
              containerName={activeModals.ingredientSelection.containerName}
              containerType={activeModals.ingredientSelection.containerName}
              ingredients={[
                {
                  name: 'Blood Samples',

                  wells: ['C2', 'C3', 'C4'],
                  wellDetails: {
                    C3: { volume: 100, concentration: 10, name: 'Special Sample' }
                  },

                  volume: 20, // required. in uL
                  concentration: null, // optional number, a %
                  description: 'blah', // optional string

                  individualized: true // when false, ignore wellDetails
                  // (we should probably delete wellDetails if individualized is set false -> true)
                },
                {
                  name: 'Control',
                  wells: ['A1'],
                  wellDetails: null,
                  volume: 50,
                  concentration: null,
                  description: '',
                  individualized: false
                },
                {
                  name: 'Buffer',
                  wells: ['H1', 'H2', 'H3', 'H4'],
                  wellDetails: null,
                  volume: 100,
                  concentration: 50,
                  description: '',
                  individualized: false
                }
              ]
            }
            />
          </div>

          <div className={styles.ingredientPanelContent}>
            <div className={styles.containerDetail}>
              <SelectablePlate />
            </div>

            {/* <button>Add Ingredient</button> */}
            {/* TODO:  ^^^ Add button back in conditionally */}
            <IngredientPropertiesForm />
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
