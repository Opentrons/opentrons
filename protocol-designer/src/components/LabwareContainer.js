import React from 'react'
import cx from 'classnames'
import styles from '../css/style.css'
import componentStyles from './LabwareContainer.css'
import { nonFillableContainers } from '../constants.js'
import { humanize } from '../utils.js'

import SelectablePlate from '../containers/SelectablePlate.js'

// import CopyIcon from '../svg/CopyIcon.js' // TODO bring back icon
import NameThisLabwareOverlay from '../components/NameThisLabwareOverlay.js'

// On an empty slot:
// * Renders a slot on the deck
// * Renders Add Labware mouseover button
//
// On a slot with a container:
// * Renders a SelectablePlate in the slot
// * Renders Add Ingreds / Delete container mouseover buttons, and dispatches their actions

// TODO: factor CenteredTextSvg out...??? is there a better way? Can't use CSS for x / y / text-anchor.
function CenteredTextSvg ({text, className}) {
  return (
    <text x='50%' y='50%' textAnchor='middle' {...{className}}>
      {text}
    </text>
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
    <g className={cx(componentStyles.slot_overlay, componentStyles.appear_on_mouseover)}>
      {/* Overlay Background */}
      <rect x='0' y='0' className={componentStyles.slot_overlay} />
      {canAddIngreds && // TODO add back canAddIngreds conditional
        <text x='0' y='25%' className={componentStyles.clickable}
          onClick={() => openIngredientSelector({containerId, slotName, containerType})}
          >
            Add Ingredients
          </text>
      }

      <text x='0' y='50%' className={componentStyles.clickable}
        onClick={() => setCopyLabwareMode(containerId)}>Copy Labware</text>

      <text x='0' y='75%' className={componentStyles.clickable}
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
      {containerName && <g className={styles.name_overlay}>
        <rect x='0' y='0' height='50%' width='100%' fill='rgba(0,0,0,0.8)' />
        <text fill='white' x='0' y='25%'>{humanize(containerType)}</text>
        <text fill='white' x='0' y='50%' className={styles.container_name}>{containerName}</text>
      </g>}
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
        : <g className={componentStyles.empty_slot}>
          <rect width='100%' height='100%' />
          <CenteredTextSvg text={slotName} />
        </g>}

      {!slotIsOccupied && (activeModals.labwareSelection
        // "Add Labware" labware selection dropdown menu
        ? null /* (slotName === canAdd) && <LabwareDropdown
              onClose={e => closeLabwareSelector({slotName})}
              onContainerChoose={containerType => createContainer({slotName, containerType})}
            /> */
        : (labwareToCopy
            // Mouseover empty slot -- Add (or Copy if in copy mode)
            ? <g className={cx(componentStyles.slot_overlay, componentStyles.appear_on_mouseover)}>
              <rect className={styles.add_labware} onClick={() => copyLabware(slotName)} />
              <CenteredTextSvg className={componentStyles.pass_thru_mouse} text='Place Copy' />
            </g>
            : <g className={cx(componentStyles.slot_overlay, componentStyles.appear_on_mouseover)}>
              <rect className={styles.add_labware} onClick={e => openLabwareSelector({slotName})} />
              <CenteredTextSvg className={componentStyles.pass_thru_mouse} text='Add Labware' />
            </g>
        )
      )}

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
