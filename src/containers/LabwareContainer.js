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
import { nonFillableContainers } from '../constants.js'
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

  const canAddIngreds = hasName && !nonFillableContainers.includes(containerType)

  return (
    <div className={styles.deckSlot}>

      {!hasName && <div className={styles.containerOverlayNameIt}>
        <label>Name this labware:</label>
        <input id={containerNameInputId}
          placeholder={humanize(containerType)}
          // Quick HACK to have enter key submit the rename action
          onKeyDown={e =>
            e.key === 'Enter' && modifyContainer({containerId, modify: {name: e.target.value}})
          }
        />
        {/* HACK: using id selector instead of stateful input field... */}
        <div className={styles.btn} onClick={() => modifyContainer(
          {
            containerId,
            modify: {
              name: document.getElementById(containerNameInputId).value || humanize(containerType)
            }
          }
        )}>Save</div>
        <div className={styles.btn} onClick={() => deleteContainer({containerId, slotName, containerType})}>
          Delete
        </div>
      </div>
      }

      {containerType && // if there's no containerType, assume it's empty
        <div className={styles.containerOverlay}>

          {canAddIngreds && <div className={styles.containerOverlayAddIngred}
            onClick={() => openIngredientSelector({containerId, slotName, containerType})}>
            Add Ingredients
          </div>}

          <div className={styles.containerOverlayRemove}
            style={canAddIngreds ? {} : {bottom: 0, position: 'absolute'}}
            onClick={() =>
              window.confirm(`Are you sure you want to permanently delete ${containerName} in slot ${slotName}?`) &&
              deleteContainer({containerId, slotName, containerType})
            }>
            <p>Remove {containerName}</p>
          </div>

        </div>}

      {containerType
        ? (
          <div>
            <div className={styles.nameOverlay}>
              <div>{humanize(containerType)}</div>
              <div className={styles.containerName}>{containerName}</div>
            </div>
            {nonFillableContainers.includes(containerType)
              ? <img src={`https://s3.amazonaws.com/opentrons-images/website/labware/${containerType}.png`} />
              : <SelectablePlate containerId={containerId} cssFillParent />
            }
          </div>
        )
        : <label>{slotName}</label>}

      {!containerType && (activeModals.labwareSelection
        ? (slotName === canAdd) && <LabwareDropdown
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
