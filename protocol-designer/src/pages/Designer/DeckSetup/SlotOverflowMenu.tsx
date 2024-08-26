import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  POSITION_ABSOLUTE,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { deleteModule } from '../../../step-forms/actions'
import { deleteDeckFixture } from '../../../step-forms/actions/additionalItems'
import {
  deleteContainer,
  duplicateLabware,
} from '../../../labware-ingred/actions'
import { getTopPortalEl } from '../../../components/portals/TopPortal'

import type { DeckSlotId } from '@opentrons/shared-data'
import type { ThunkDispatch } from '../../../types'

interface SlotOverflowMenuProps {
  slot: DeckSlotId
  xSlotPosition: number
  ySlotPosition: number
  setShowMenuList: (value: React.SetStateAction<boolean>) => void
  addEquipment: (slotId: string) => void
}
export function SlotOverflowMenu(
  props: SlotOverflowMenuProps
): JSX.Element | null {
  const {
    slot,
    xSlotPosition,
    ySlotPosition,
    setShowMenuList,
    addEquipment,
  } = props
  const { t } = useTranslation('starting_deck_state')
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const {
    labware: deckSetupLabware,
    modules: deckSetupModules,
    additionalEquipmentOnDeck,
  } = deckSetup

  const moduleOnSlot = Object.values(deckSetupModules).find(
    module => module.slot === slot
  )
  const labwareOnSlot = Object.values(deckSetupLabware).find(
    lw => lw.slot === slot || lw.slot === moduleOnSlot?.id
  )
  const isLabwareTiprack = labwareOnSlot?.def.parameters.isTiprack ?? false
  const isLabwareAnAdapter =
    labwareOnSlot?.def.allowedRoles?.includes('adapter') ?? false
  const nestedLabwareOnSlot = Object.values(deckSetupLabware).find(lw =>
    Object.keys(deckSetupLabware).includes(lw.slot)
  )
  const fixturesOnSlot = Object.values(additionalEquipmentOnDeck).filter(
    ae => ae.location?.split('cutout')[1] === slot
  )

  const hasNoItems =
    moduleOnSlot == null && labwareOnSlot == null && fixturesOnSlot.length === 0
  const hasTrashOnSlot = fixturesOnSlot.some(
    fixture => fixture.name === 'trashBin'
  )
  const handleClear = (): void => {
    //  clear module from slot
    if (moduleOnSlot != null) {
      dispatch(deleteModule(moduleOnSlot.id))
    }
    //  clear fixture(s) from slot
    if (fixturesOnSlot.length > 0) {
      fixturesOnSlot.forEach(fixture => dispatch(deleteDeckFixture(fixture.id)))
    }
    //  clear labware from slot
    if (labwareOnSlot != null) {
      dispatch(deleteContainer({ labwareId: labwareOnSlot.id }))
    }
    //  clear nested labware from slot
    if (nestedLabwareOnSlot != null) {
      dispatch(deleteContainer({ labwareId: nestedLabwareOnSlot.id }))
    }
  }

  return createPortal(
    <Overlay
      data-testid="SlotOverflowMenu_Overlay"
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation()
        setShowMenuList(false)
      }}
    >
      <Flex
        whiteSpace="nowrap"
        zIndex={10}
        borderRadius={BORDERS.borderRadius8}
        boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
        position={POSITION_ABSOLUTE}
        backgroundColor={COLORS.white}
        //  todo(ja, 8/22/24): lol we need to fix these positions based off othe deck map & slot
        right={ySlotPosition}
        top={200 + xSlotPosition}
        flexDirection={DIRECTION_COLUMN}
        onClick={(e: React.MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <MenuButton
          onClick={() => {
            addEquipment(slot)
            setShowMenuList(false)
          }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('add_hw_lw')}
          </StyledText>
        </MenuButton>
        <MenuButton
          disabled={labwareOnSlot == null || isLabwareAnAdapter}
          onClick={() => {
            //  todo(ja, 8/22/24): wire this up
            console.log('open nick name modal')
            setShowMenuList(false)
          }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('rename_lab')}
          </StyledText>
        </MenuButton>
        <MenuButton
          disabled={labwareOnSlot == null || isLabwareTiprack}
          onClick={() => {
            //  todo(ja, 8/22/24): wire this up
            console.log('open liquids')
            setShowMenuList(false)
          }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('add_liquid')}
          </StyledText>
        </MenuButton>
        <MenuButton
          disabled={labwareOnSlot == null && !isLabwareAnAdapter}
          onClick={() => {
            if (labwareOnSlot != null && !isLabwareAnAdapter) {
              dispatch(duplicateLabware(labwareOnSlot.id))
            } else if (nestedLabwareOnSlot != null) {
              dispatch(duplicateLabware(nestedLabwareOnSlot.id))
            }
            setShowMenuList(false)
          }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('duplicate')}
          </StyledText>
        </MenuButton>
        <MenuButton
          disabled={hasNoItems || hasTrashOnSlot}
          onClick={() => {
            handleClear()
            setShowMenuList(false)
          }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('clear_slot')}
          </StyledText>
        </MenuButton>
      </Flex>
    </Overlay>,
    getTopPortalEl()
  )
}

const MenuButton = styled.button`
  background-color: ${COLORS.transparent};

  cursor: pointer;
  padding: ${SPACING.spacing8} ${SPACING.spacing12};
  border: none;
  &:hover {
    background-color: ${COLORS.blue10};
  }
  &:disabled {
    color: ${COLORS.grey40};
    cursor: auto;
  }
`
const Overlay = styled.div`
  position: ${POSITION_ABSOLUTE};
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 1;
  background-color: ${COLORS.transparent};
  cursor: default;
`
