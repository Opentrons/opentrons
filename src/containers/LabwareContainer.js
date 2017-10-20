// NOTE: This mixed container + component does a lot right now:
//
// On an empty slot:
// * Renders a slot on the deck
// * Renders Add Labware mouseover button
//
// On a slot with a container:
// * Renders a SelectablePlate in the slot
// * Renders Add Ingreds / Delete container mouseover buttons, and dispatches their actions

import React from 'react'
import { connect } from 'react-redux'

import styles from '../css/style.css'

import { humanize } from '../utils.js'
import { selectors } from '../reducers'
import {
  openIngredientSelector,

  createContainer,
  deleteContainer,
  modifyContainer,

  openLabwareSelector,
  closeLabwareSelector
} from '../actions'

import SelectablePlate from '../containers/SelectablePlate.js'
import LabwareDropdown from '../components/LabwareDropdown.js'

const LabwareContainer = ({
  slotName,

  containerId,
  containerType,
  containerName,

  canAdd,

  activeModals,
  openIngredientSelector,

  createContainer,
  deleteContainer,
  modifyContainer,

  openLabwareSelector,
  closeLabwareSelector
}) => {
  const hasName = containerName !== null
  // HACK: should use a stateful input component
  const containerNameInputId = slotName

  return (
    <div className={styles.deckSlot}>
      {containerType
        ? <SelectablePlate containerId={containerId} cssFillParent />
        : <label>{slotName}</label>}

      {containerType && // if there's no containerType, assume it's empty
        <div className={styles.containerOverlay}>

          {!hasName && <div className={styles.containerOverlayNameIt}>
            <label>Name:</label>
            <input id={containerNameInputId} placeholder={humanize(containerType)} />
            <div onClick={() => modifyContainer({
              containerId,
              modify: {name: document.getElementById(containerNameInputId).value}})}>‎✔</div>
            <div onClick={() => modifyContainer({
              containerId,
              modify: {name: humanize(containerType)}})}>‎✕</div>
          </div>}

          {hasName && <div className={styles.containerOverlayAddIngred} onClick={() => openIngredientSelector({containerId, slotName, containerType})}>
            Add Ingredients
          </div>}

          {hasName && <div className={styles.containerOverlayRemove} onClick={() => deleteContainer({containerId, slotName, containerType})}>
            <p>Remove {containerName}</p>
          </div>}

        </div>}

      {(slotName === canAdd) && (activeModals.labwareSelection
        ? <LabwareDropdown
          onClose={e => closeLabwareSelector({slotName})}
          onContainerChoose={containerType => createContainer({slotName, containerType})}
        />
        : <div className={styles.addLabware} onClick={e => openLabwareSelector({slotName})}>
              Add Labware
          </div>
      )}
    </div>
  )
}

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
    modifyContainer,

    openIngredientSelector,
    openLabwareSelector,

    closeLabwareSelector
  }
)(LabwareContainer)
