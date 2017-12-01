import React from 'react'

import styles from '../css/style.css'
import { nonFillableContainers } from '../constants.js'
import { humanize } from '../utils.js'

import SelectablePlate from '../containers/SelectablePlate.js'
import LabwareDropdown from '../components/LabwareDropdown.js'

import CopyIcon from '../svg/CopyIcon.js'

// On an empty slot:
// * Renders a slot on the deck
// * Renders Add Labware mouseover button
//
// On a slot with a container:
// * Renders a SelectablePlate in the slot
// * Renders Add Ingreds / Delete container mouseover buttons, and dispatches their actions

function NameThisLabwareOverlay ({
  containerType,
  containerId,
  slotName,
  modifyContainer,
  deleteContainer
}) {
  // HACK: should use a stateful input component
  const containerNameInputId = slotName

  return (
    <div className={styles.container_overlay_name_it}>
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
  )
}

function OccupiedDeckSlotOverlay ({
  canAddIngreds,
  containerId,
  slotName,
  containerType,
  containerName,
  openIngredientSelector,
  setCopyLabwareMode,
  deleteContainer
}) {
  return (
    <div className={styles.container_overlay}>

      {canAddIngreds && <div className={styles.container_overlay_add_ingred}
        onClick={() => openIngredientSelector({containerId, slotName, containerType})}>
        Add Ingredients
      </div>}

      <div className={styles.container_overlay_copy}
        onClick={() => setCopyLabwareMode(containerId)}
      >
        <div>Copy Labware</div>
        {/* TODO: icon CSS class, diff sizes? */}
        <CopyIcon style={{width: '20px', height: '20px'}} />
      </div>

      <div className={styles.container_overlay_remove}
        style={canAddIngreds ? {} : {bottom: 0, position: 'absolute'}}
        onClick={() =>
          window.confirm(`Are you sure you want to permanently delete ${containerName} in slot ${slotName}?`) &&
          deleteContainer({containerId, slotName, containerType})
        }>
        <p>Remove {containerName}</p>
      </div>

    </div>
  )
}

function SlotWithContainer ({containerType, containerName, containerId}) {
  return (
    <div>
      <div className={styles.name_overlay}>
        <div>{humanize(containerType)}</div>
        <div className={styles.container_name}>{containerName}</div>
      </div>
      {nonFillableContainers.includes(containerType)
        ? <img src={`https://s3.amazonaws.com/opentrons-images/website/labware/${containerType}.png`} />
        : <SelectablePlate containerId={containerId} cssFillParent />
      }
    </div>
  )
}

export default function LabwareContainer ({
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
  closeLabwareSelector,

  setCopyLabwareMode,
  labwareToCopy,
  copyLabware
}) {
  const hasName = containerName !== null
  const slotIsOccupied = !!containerType

  const canAddIngreds = hasName && !nonFillableContainers.includes(containerType)

  return (
    <div className={styles.deck_slot}>

      {!hasName && <NameThisLabwareOverlay {...{
        containerType,
        containerId,
        slotName,
        modifyContainer,
        deleteContainer
      }} />}

      {slotIsOccupied &&
        <OccupiedDeckSlotOverlay {...{
          canAddIngreds,
          containerId,
          slotName,
          containerType,
          containerName,
          openIngredientSelector,
          setCopyLabwareMode,
          deleteContainer
        }} />}

      {/* The actual deck slot container: rendering of container, or rendering of empty slot */}
      {slotIsOccupied
        ? <SlotWithContainer {...{containerType, containerName, containerId}} />
        // Empty slot
        : <label>{slotName}</label>}

      {!slotIsOccupied && (activeModals.labwareSelection
        // "Add Labware" labware selection dropdown menu
        ? (slotName === canAdd) && <LabwareDropdown
          onClose={e => closeLabwareSelector({slotName})}
          onContainerChoose={containerType => createContainer({slotName, containerType})}
        />
        : (labwareToCopy
            // Mouseover empty slot -- Add (or Copy if in copy mode)
            ? <div className={styles.add_labware} onClick={() => copyLabware(slotName)}>Place Copy</div>
            : <div className={styles.add_labware} onClick={e => openLabwareSelector({slotName})}>
            Add Labware
          </div>
        )
      )}
    </div>
  )
}
