import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  NO_WRAP,
  SPACING,
  StyledText,
  useOnClickOutside,
} from '@opentrons/components'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { deleteModule } from '../../../step-forms/actions'
import { EditNickNameModal } from '../../../organisms'
import { deleteDeckFixture } from '../../../step-forms/actions/additionalItems'
import {
  deleteContainer,
  duplicateLabware,
  openIngredientSelector,
} from '../../../labware-ingred/actions'
import type { DeckSlotId } from '@opentrons/shared-data'
import type { ThunkDispatch } from '../../../types'

interface SlotOverflowMenuProps {
  slot: DeckSlotId
  setShowMenuList: (value: React.SetStateAction<boolean>) => void
  addEquipment: (slotId: string) => void
}
export function SlotOverflowMenu(
  props: SlotOverflowMenuProps
): JSX.Element | null {
  const { slot, setShowMenuList, addEquipment } = props
  const { t } = useTranslation('starting_deck_state')
  const navigate = useNavigate()
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const [showNickNameModal, setShowNickNameModal] = React.useState<boolean>(
    false
  )
  const overflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      if (!showNickNameModal) {
        setShowMenuList(false)
      }
    },
  })
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

  return (
    <>
      {showNickNameModal && labwareOnSlot != null ? (
        <EditNickNameModal
          onClose={() => {
            setShowNickNameModal(false)
          }}
          labwareId={
            nestedLabwareOnSlot != null
              ? nestedLabwareOnSlot.id
              : labwareOnSlot.id
          }
        />
      ) : null}
      <Flex
        whiteSpace={NO_WRAP}
        ref={overflowWrapperRef}
        borderRadius={BORDERS.borderRadius8}
        boxShadow="0px 1px 3px rgba(0, 0, 0, 0.2)"
        backgroundColor={COLORS.white}
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
          onClick={(e: React.MouseEvent) => {
            setShowNickNameModal(true)
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('rename_lab')}
          </StyledText>
        </MenuButton>
        <MenuButton
          disabled={
            labwareOnSlot == null ||
            (labwareOnSlot != null && isLabwareAnAdapter) ||
            isLabwareTiprack
          }
          onClick={() => {
            if (labwareOnSlot != null) {
              dispatch(openIngredientSelector(labwareOnSlot.id))
            }
            navigate('/liquids')
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
    </>
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
