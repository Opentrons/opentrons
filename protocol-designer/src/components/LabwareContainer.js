import React from 'react'

import styles from '../css/style.css'
import { nonFillableContainers } from '../constants.js'
import { humanize } from '../utils.js'

import SelectablePlate from '../containers/SelectablePlate.js'

import CopyIcon from '../svg/CopyIcon.js'

// On an empty slot:
// * Renders a slot on the deck
// * Renders Add Labware mouseover button
//
// On a slot with a container:
// * Renders a SelectablePlate in the slot
// * Renders Add Ingreds / Delete container mouseover buttons, and dispatches their actions

// TODO: factor this out... is there a better way? Can't use CSS for x / y / text-anchor.
function CenteredTextSvg ({text}) {
  return (
    <text x='50%' y='50%' textAnchor='middle'>
      {text}
    </text>
  )
}

function NameThisLabwareOverlay ({
  containerType,
  containerId,
  slotName,
  modifyContainer,
  deleteContainer
}) {
  // HACK: should use a stateful input component
  // TODO Ian 2017-12-04 bring in pure SVG input box
  // const containerNameInputId = slotName

  return (
    // <div className={styles.container_overlay_name_it}>
    <g>
      <text x='0' y='0'>Name this labware:</text>
      <text x='0' y='25%'>"TODO name here"</text>
      <text x='0' y='50%' onClick={() => modifyContainer(
        {
          containerId,
          modify: {
            name: 'TODO: name'
            // name: document.getElementById(containerNameInputId).value || humanize(containerType)
          }
        }
      )}>
        Save
      </text>
      <text x='0' y='75%'
        onClick={() => deleteContainer({containerId, slotName, containerType})}
      >
          Delete
      </text>
      {/* <input id={containerNameInputId}
        placeholder={humanize(containerType)}
        // Quick HACK to have enter key submit the rename action
        onKeyDown={e =>
          e.key === 'Enter' && modifyContainer({containerId, modify: {name: e.target.value}})
        }
      />
      {/* HACK: using id selector instead of stateful input field... */}
      {/* <div className={styles.btn} onClick={() => modifyContainer(
        {
          containerId,
          modify: {
            name: document.getElementById(containerNameInputId).value || humanize(containerType)
          }
        }
      )}>Save</div>
      <div className={styles.btn} onClick={() => deleteContainer({containerId, slotName, containerType})}>
        Delete
      </div> */}
    </g>
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
    // <div className={styles.container_overlay}>
    //
    //   {canAddIngreds && <div className={styles.container_overlay_add_ingred}
    //     onClick={() => openIngredientSelector({containerId, slotName, containerType})}>
    //     Add Ingredients
    //   </div>}
    //
    //   <div className={styles.container_overlay_copy}
    //     onClick={() => setCopyLabwareMode(containerId)}
    //   >
    //     <div>Copy Labware</div>
    //     <CopyIcon style={{width: '20px', height: '20px'}} />
    //   </div>
    //
    //   <div className={styles.container_overlay_remove}
    //     style={canAddIngreds ? {} : {bottom: 0, position: 'absolute'}}
    //     onClick={() =>
    //       window.confirm(`Are you sure you want to permanently delete ${containerName} in slot ${slotName}?`) &&
    //       deleteContainer({containerId, slotName, containerType})
    //     }>
    //     <p>Remove {containerName}</p>
    //   </div>
    <g>
      {/* Overlay Background */}
      <rect fill='rgba(0,0,0,0.5)' width='100%' height='100%' />
      {// canAddIngreds && // TODO add back canAddIngreds conditional
        <text x='0' y='25%'
          onClick={() => openIngredientSelector({containerId, slotName, containerType})}
          >
            Add Ingredients
          </text>
      }
      <text x='0' y='50%' onClick={() => setCopyLabwareMode(containerId)}>Copy Labware</text>
      <text x='0' y='75%'
        onClick={() =>
            window.confirm(`Are you sure you want to permanently delete ${containerName} in slot ${slotName}?`) &&
            deleteContainer({containerId, slotName, containerType})
        }
      >
        Remove {containerName}
      </text>
    </g>
  )
}

function SlotWithContainer ({containerType, containerName, containerId}) {
  return (
    <g>
      {nonFillableContainers.includes(containerType)
        ? <img src={`https://s3.amazonaws.com/opentrons-images/website/labware/${containerType}.png`} />
        : <SelectablePlate containerId={containerId} cssFillParent />
      }
      <g className={styles.name_overlay}>
        <rect x='0' y='0' height='50%' width='100%' fill='rgba(0,0,0,0.8)' />
        <text fill='white' x='0' y='25%'>{humanize(containerType)}</text>
        <text fill='white' x='0' y='50%' className={styles.container_name}>{containerName}</text>
      </g>
    </g>
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
  copyLabware,

  height,
  width
}) {
  const hasName = containerName !== null
  const slotIsOccupied = !!containerType

  const canAddIngreds = hasName && !nonFillableContainers.includes(containerType)

  return (
    <svg {...{height, width}} className={styles.deck_slot}>
      {/* The actual deck slot container: rendering of container, or rendering of empty slot */}
      {slotIsOccupied
        ? <SlotWithContainer {...{containerType, containerName, containerId}} />
        // Empty slot
        : <g>
          <rect fill='rgba(255,0,0,0.25)' stroke='black' width='100%' height='100%' />
          <CenteredTextSvg text={slotName} />
        </g>}

      {slotIsOccupied && hasName &&
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

      {!slotIsOccupied && (activeModals.labwareSelection
        // "Add Labware" labware selection dropdown menu
        ? null /* (slotName === canAdd) && <LabwareDropdown
              onClose={e => closeLabwareSelector({slotName})}
              onContainerChoose={containerType => createContainer({slotName, containerType})}
            /> */
        : (labwareToCopy
            // Mouseover empty slot -- Add (or Copy if in copy mode)
            ? <g>
              <rect className={styles.add_labware} onClick={() => copyLabware(slotName)} />
              <CenteredTextSvg text='Place Copy' />
            </g>
            : <g>
              <rect className={styles.add_labware} onClick={e => openLabwareSelector({slotName})} />
              <CenteredTextSvg text='Add Labware' />
            </g>
        )
      )}

      {!hasName && <NameThisLabwareOverlay {...{
        containerType,
        containerId,
        slotName,
        modifyContainer,
        deleteContainer
      }} />}
    </svg>
  )
}
