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
  EmptyDeckSlot,
  SLOT_WIDTH,
  SLOT_HEIGHT,
  humanizeLabwareType
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
          iconName='pen' y='25%' text='Edit Details' />
      }
      <ClickableText onClick={() => setCopyLabwareMode(containerId)}
        iconName='cursor-move' y='50%' text='Copy' />
      {/* TODO Ian 2018-02-16 Move labware, not copy labware. */}

      <ClickableText onClick={() =>
          window.confirm(`Are you sure you want to permanently delete ${containerName || containerType} in slot ${slot}?`) &&
          deleteContainer({containerId, slot, containerType})
      }
        iconName='close' y='75%' text='Delete' />
    </g>
  )
}

// TODO HACK Ian 2018-05-23 this is a temporary workaround until we use SVG tip racks
const IMG_TIP_RACK_10UL = require('../../images/labware/10 uL Tip Rack.png')
const IMG_TIP_RACK_GENERIC = require('../../images/labware/Tip Rack.png')
const IMG_TRASH = require('../../images/labware/Trash.png')
const FALLBACK_IMG = IMG_TIP_RACK_GENERIC // TODO LATER OR NEVER Ian 2018-04-23 better fallback img?
const labwareImages = {
  'tiprack-10ul': IMG_TIP_RACK_10UL,

  'tiprack-200ul': IMG_TIP_RACK_GENERIC,
  'GEB-tiprack-300ul': IMG_TIP_RACK_GENERIC,

  'tiprack-1000ul': IMG_TIP_RACK_GENERIC,
  'tiprack-1000ul-chem': IMG_TIP_RACK_GENERIC,

  'trash-box': IMG_TRASH
}

type SlotWithContainerProps = {
  containerType: string,
  displayName: string,
  containerId: string
}

function SlotWithContainer (props: SlotWithContainerProps) {
  const {containerType, displayName, containerId} = props

  return (
    <g>
      {nonFillableContainers.includes(containerType)
        ? <image // TODO do real styles and maybe get SVG landscape images
          href={labwareImages[containerType] || FALLBACK_IMG}
          width={SLOT_WIDTH} height={SLOT_HEIGHT}
        />
        : <SelectablePlate containerId={containerId} cssFillParent />
      }
      <ContainerNameOverlay title={displayName || humanizeLabwareType(containerType)} />
      {/* TODO NEXT Ian 2018-05-25 support disambiguation number '96 Flat (1)' */}
    </g>
  )
}

type LabwareOnDeckProps = {
  slot: string,

  containerId: string,
  containerType: string,
  containerName: ?string,
  showNameOverlay: ?boolean,

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
    showNameOverlay,

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

  const slotIsOccupied = !!containerType

  const canAddIngreds = !showNameOverlay && !nonFillableContainers.includes(containerType)

  return (
    <LabwareContainer {...{height, width, slot}} highlighted={highlighted}>
      {/* The actual deck slot container: rendering of container, or rendering of empty slot */}
      {slotIsOccupied
        ? <SlotWithContainer displayName={containerName || containerType} {...{containerType, containerId}} />
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
                iconName='content-copy' y='65%' text='Add Copy' />
            </g>
        )
      }

      {deckSetupMode && slotIsOccupied && !showNameOverlay &&
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

      {deckSetupMode && showNameOverlay && <NameThisLabwareOverlay {...{
        containerType,
        containerId,
        slot,
        modifyContainer,
        deleteContainer
      }} />}
    </LabwareContainer>
  )
}
