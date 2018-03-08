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
import {
  CenteredTextSvg,
  LabwareContainer,
  ContainerNameOverlay,
  EmptyDeckSlot
} from '@opentrons/components'

import {nonFillableContainers} from '../../constants'
import styles from './labware.css'

import ClickableText from './ClickableText'
import SelectablePlate from '../../containers/SelectablePlate.js'
import NameThisLabwareOverlay from './NameThisLabwareOverlay.js'

function OccupiedDeckSlotOverlay ({
  canAddIngreds,
  containerId,
  slot,
  containerType,
  containerName,
  openIngredientSelector,
  setCopyLabwareMode,
  deleteContainer
}) {
  return (
    <g className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
      <rect className={styles.overlay_panel} />
      {canAddIngreds &&
        <ClickableText onClick={() => openIngredientSelector(containerId)}
          iconName='plus' y='25%' text='Edit Ingredients' />
      }
      <ClickableText onClick={() => setCopyLabwareMode(containerId)}
        iconName='move' y='50%' text='Copy Labware' />
      {/* TODO Ian 2018-02-16 Move labware, not copy labware. */}

      <ClickableText onClick={() =>
          window.confirm(`Are you sure you want to permanently delete ${containerName || containerType} in slot ${slot}?`) &&
          deleteContainer({containerId, slot, containerType})
      }
        iconName='close' y='75%' text='Delete Labware' />
    </g>
  )
}

function SlotWithContainer ({containerType, containerName, containerId}) {
  // NOTE: Ian 2017-12-06 is this a good or bad idea for SVG layouts?

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
      {containerName && <ContainerNameOverlay {...{containerType, containerName}} />}
    </g>
  )
}

type LabwareOnDeckProps = {
  slot: string,

  containerId: string,
  containerType: string,
  containerName: ?string,

  // canAdd: boolean,

  activeModals: {
    ingredientSelection: ?{
      containerName: ?string,
      slot: ?string
    },
    labwareSelection: boolean
  },
  openIngredientSelector: (containerId: string) => void,

  // createContainer: ({slot: string, containerType: string}) => mixed,
  deleteContainer: ({containerId: string, slot: string, containerType: string}) => void,
  modifyContainer: ({containerId: string, modify: {[field: string]: mixed}}) => void, // eg modify = {name: 'newName'}

  openLabwareSelector: ({slot: string}) => void,
  // closeLabwareSelector: ({slot: string}) => mixed,

  setCopyLabwareMode: (containerId: string) => void,
  labwareToCopy: string | false,
  copyLabware: (slot: string) => void,

  height?: number,
  width?: number,
  highlighted: boolean,

  deckSetupMode: boolean
}

export default function LabwareOnDeck (props: LabwareOnDeckProps) {
  const {
    slot,

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
    highlighted,

    deckSetupMode
  } = props

  const hasName = containerName !== null
  const slotIsOccupied = !!containerType

  const canAddIngreds = hasName && !nonFillableContainers.includes(containerType)

  return (
    <LabwareContainer {...{height, width, slot}} highlighted={deckSetupMode && highlighted}>
      {/* The actual deck slot container: rendering of container, or rendering of empty slot */}
      {slotIsOccupied
        ? <SlotWithContainer {...{containerType, containerName, containerId}} />
        : <EmptyDeckSlot {...{height, width, slot}} />
      }

      {(!deckSetupMode || (!slotIsOccupied && activeModals.labwareSelection))
        // "Add Labware" labware selection dropdown menu
        ? null
        : (labwareToCopy
            // Mouseover empty slot -- Add (or Copy if in copy mode)
            ? <g className={cx(styles.slot_overlay, styles.appear_on_mouseover)}>
              <rect className={styles.overlay_panel} onClick={() => copyLabware(slot)} />
              <CenteredTextSvg className={cx(styles.pass_thru_mouse, styles.clickable_text)} text='Place Copy' />
            </g>
            : <g className={cx(styles.slot_overlay, styles.appear_on_mouseover, styles.add_labware)}>
              <rect className={styles.overlay_panel} />
              <ClickableText onClick={e => openLabwareSelector({slot})}
                iconName='plus' y='40%' text='Add Labware' />
              <ClickableText onClick={e => window.alert('NOT YET IMPLEMENTED: Add Copy') /* TODO: New Copy feature */}
                iconName='copy' y='65%' text='Add Copy' />
            </g>
        )
      }

      {deckSetupMode && slotIsOccupied && hasName &&
        <OccupiedDeckSlotOverlay {...{
          canAddIngreds,
          containerId,
          slot,
          containerType,
          containerName,
          openIngredientSelector,
          setCopyLabwareMode,
          deleteContainer
        }} />}

      {deckSetupMode && !hasName && <NameThisLabwareOverlay {...{
        containerType,
        containerId,
        slot,
        modifyContainer,
        deleteContainer
      }} />}
    </LabwareContainer>
  )
}
