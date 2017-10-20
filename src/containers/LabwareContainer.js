import React from 'react'
import { connect } from 'react-redux'

import styles from '../css/style.css'

import { selectors } from '../reducers'
import { openIngredientSelector, deleteContainer, createContainer, openLabwareSelector, closeLabwareSelector } from '../actions'

import LabwareDropdown from '../components/LabwareDropdown.js'

// TODO: this div doesn't need to be a component!
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

const LabwareContainer = ({
  slotName,
  containerType,
  containerId,
  canAdd,

  activeModals,
  openIngredientSelector,

  createContainer,
  deleteContainer,

  openLabwareSelector,
  closeLabwareSelector
}) => (
  <div className={styles.deckSlot}>
    {containerType
      ? <img src={getPlateTopdownImg(containerType)} />
      : <label>{slotName}</label>}

    {containerType && // if there's no containerType, assume it's empty
      <div className={styles.containerOverlay}>
        <div className={styles.containerOverlayAddIngred} onClick={() => openIngredientSelector({containerId, slotName, containerType})}>
          Add Ingredients
        </div>
        <div className={styles.containerOverlayRemove} onClick={() => deleteContainer({containerId, slotName, containerType})}>
          Remove {containerType}
        </div>
      </div>}

    {(slotName === canAdd) && (activeModals.labwareSelection
      ? <LabwareDropdown
        onClose={e => closeLabwareSelector({slotName})}
        createContainer={createContainer}
      />
      : <AddLabware onClick={e => openLabwareSelector({slotName})} />
    )}
  </div>
)

export default connect(
  (state, ownProps) => {
    const container = selectors.containersBySlot(state)[ownProps.slotName]
    const containerInfo = (container)
      ? { containerType: container.type, containerId: container.containerId, containerName: container.name }
      : {}
    return {
      ...containerInfo,
      canAdd: selectors.canAdd(state),
      activeModals: selectors.activeModals(state)
    }
  },
  {
    createContainer,
    deleteContainer,

    openIngredientSelector,
    openLabwareSelector,

    closeLabwareSelector
  }
)(LabwareContainer)
