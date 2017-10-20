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

import { selectors } from '../reducers'
import {
  openIngredientSelector,

  createContainer,
  deleteContainer,

  openLabwareSelector,
  closeLabwareSelector
} from '../actions'

import SelectablePlate from '../containers/SelectablePlate.js'
import LabwareDropdown from '../components/LabwareDropdown.js'

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
      ? <SelectablePlate containerId={containerId} cssFillParent />
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
      : <div className={styles.addLabware} onClick={e => openLabwareSelector({slotName})}>
            Add Labware
        </div>
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
