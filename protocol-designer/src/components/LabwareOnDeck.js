// @flow

// On an empty slot:
// * Renders a slot on the deck
// * Renders Add Labware mouseover button
//
// On a slot with a container:
// * Renders a SelectablePlate in the slot
// * Renders Add Ingreds / Delete container mouseover buttons, and dispatches their actions

import React from 'react'
import cx from 'classnames'
import { CenteredTextSvg, LabwareContainer, allStyles } from '@opentrons/components'

import { nonFillableContainers, SLOT_HEIGHT } from '../constants'
import { humanize } from '../utils'

// import CopyIcon from '../svg/CopyIcon.js' // TODO bring back icon
import SelectablePlate from '../containers/SelectablePlate.js'
import NameThisLabwareOverlay from '../components/NameThisLabwareOverlay.js'

const styles = allStyles.LabwareContainer

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
    <g className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
      {/* Overlay Background */}
      <rect x='0' y='0' className={styles.slot_overlay} />
      {canAddIngreds && // TODO add back canAddIngreds conditional
        <text x='0' y='25%' className={styles.clickable}
          onClick={() => openIngredientSelector({containerId, slotName, containerType})}
          >
            Add Ingredients
          </text>
      }

      <text x='0' y='50%' className={styles.clickable}
        onClick={() => setCopyLabwareMode(containerId)}>Copy Labware</text>

      <text x='0' y='75%' className={styles.clickable}
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
  // NOTE: Ian 2017-12-06 is this a good or bad idea for SVG layouts?
  const paddingLeft = 4
  const paddingTop = 0
  const boxHeight = 25
  return (
    <g>
      {nonFillableContainers.includes(containerType)
        ? <image // TODO do real styles and maybe get SVG landscape images
          href={`https://s3.amazonaws.com/opentrons-images/website/labware/${containerType}.png`}
          width='120' height='120'
          transform='translate(125 -15) rotate(90)'
        />
        : <SelectablePlate containerId={containerId} cssFillParent />
      }
      {containerName && <g className={styles.name_overlay}>
        <g transform={`translate(0 ${SLOT_HEIGHT - boxHeight})`}>
          <rect x='0' y='0' height={boxHeight} width='100%' />
          <text x={paddingLeft} y={0.4 * boxHeight + paddingTop} className={styles.container_type}>
            {humanize(containerType).toUpperCase()}
          </text>
          <text x={paddingLeft} y={0.85 * boxHeight + paddingTop}>
            {containerName}
          </text>
        </g>
      </g>}
    </g>
  )
}

type LabwareOnDeckProps = {
  slotName: string,

  containerId: string,
  containerType: string,
  containerName: string,

  // canAdd: boolean,

  activeModals: any, // TODO
  openIngredientSelector: ({containerId: string, slotName: string, containerType: string}) => mixed,

  // createContainer: ({slotName: string, containerType: string}) => mixed,
  deleteContainer: ({containerId: string, slotName: string, containerType: string}) => mixed,
  modifyContainer: ({containerId: string, modify: mixed}) => mixed, // eg modify = {name: 'newName'}

  openLabwareSelector: ({slotName: string}) => mixed,
  // closeLabwareSelector: ({slotName: string}) => mixed,

  setCopyLabwareMode: (containerId: string) => mixed,
  labwareToCopy: string, // ?
  copyLabware : (slotName: string) => mixed,

  height: number,
  width: number,
  highlighted: boolean
}

export function LabwareOnDeck (props: LabwareOnDeckProps) {
  const {
    slotName,

    containerId,
    containerType,
    containerName,

    // canAdd,

    activeModals,
    openIngredientSelector,

    // createContainer,
    deleteContainer,
    modifyContainer,

    openLabwareSelector,
    // closeLabwareSelector,

    setCopyLabwareMode,
    labwareToCopy,
    copyLabware,

    height,
    width,
    highlighted
  } = props

  const hasName = containerName !== null
  const slotIsOccupied = !!containerType

  const canAddIngreds = hasName && !nonFillableContainers.includes(containerType)

  return (
    <LabwareContainer {...{height, width, highlighted}}>
      {/* The actual deck slot container: rendering of container, or rendering of empty slot */}
      {slotIsOccupied
        ? <SlotWithContainer {...{containerType, containerName, containerId}} />
        // Empty slot TODO Ian 2017-12-13 use EmptyDeckSlot from component lib
        : <g className={styles.empty_slot}>
          <rect width='100%' height='100%' />
          <CenteredTextSvg text={slotName} />
        </g>}

      {!slotIsOccupied && (activeModals.labwareSelection
        // "Add Labware" labware selection dropdown menu
        ? null
        : (labwareToCopy
            // Mouseover empty slot -- Add (or Copy if in copy mode)
            ? <g className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
              <rect className={styles.add_labware} onClick={() => copyLabware(slotName)} />
              <CenteredTextSvg className={styles.pass_thru_mouse} text='Place Copy' />
            </g>
            : <g className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
              <rect className={styles.add_labware} onClick={e => openLabwareSelector({slotName})} />
              <CenteredTextSvg className={styles.pass_thru_mouse} text='Add Labware' />
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
    </LabwareContainer>
  )
}
