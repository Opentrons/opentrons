import * as React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  BORDERS,
  COLORS,
  CURSOR_AUTO,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  Flex,
  NO_WRAP,
  POSITION_ABSOLUTE,
  RobotCoordsForeignDiv,
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
import { selectors as labwareIngredSelectors } from '../../../labware-ingred/selectors'
import type { CoordinateTuple, DeckSlotId } from '@opentrons/shared-data'
import type { ThunkDispatch } from '../../../types'

const ROBOT_BOTTOM_HALF_SLOTS = [
  'D1',
  'D2',
  'D3',
  'D4',
  'C1',
  'C2',
  'C3',
  'C4',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
]
const BOTTOM_SLOT_Y_POSITION = -70
const TOP_SLOT_Y_POSITION = 50
const TOP_SLOT_Y_POSITION_ALL_BUTTONS = 110
const TOP_SLOT_Y_POSITION_2_BUTTONS = 35

interface SlotOverflowMenuProps {
  //   can be off-deck id or deck slot
  location: DeckSlotId | string
  setShowMenuList: (value: React.SetStateAction<boolean>) => void
  addEquipment: (slotId: string) => void
  menuListSlotPosition?: CoordinateTuple
}
export function SlotOverflowMenu(
  props: SlotOverflowMenuProps
): JSX.Element | null {
  const {
    location,
    setShowMenuList,
    addEquipment,
    menuListSlotPosition,
  } = props
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

  const liquidLocations = useSelector(
    labwareIngredSelectors.getLiquidsByLabwareId
  )

  const {
    labware: deckSetupLabware,
    modules: deckSetupModules,
    additionalEquipmentOnDeck,
  } = deckSetup
  const isOffDeckLocation = deckSetupLabware[location] != null

  const moduleOnSlot = Object.values(deckSetupModules).find(
    module => module.slot === location
  )
  const labwareOnSlot = Object.values(deckSetupLabware).find(lw =>
    isOffDeckLocation
      ? lw.id === location
      : lw.slot === location || lw.slot === moduleOnSlot?.id
  )
  const isLabwareTiprack = labwareOnSlot?.def.parameters.isTiprack ?? false
  const isLabwareAnAdapter =
    labwareOnSlot?.def.allowedRoles?.includes('adapter') ?? false
  const nestedLabwareOnSlot = Object.values(deckSetupLabware).find(
    lw => lw.slot === labwareOnSlot?.id
  )
  const fixturesOnSlot = Object.values(additionalEquipmentOnDeck).filter(
    ae => ae.location?.split('cutout')[1] === location
  )

  const hasNoItems =
    moduleOnSlot == null && labwareOnSlot == null && fixturesOnSlot.length === 0

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
  const showDuplicateBtn =
    (labwareOnSlot != null &&
      !isLabwareAnAdapter &&
      nestedLabwareOnSlot == null) ||
    nestedLabwareOnSlot != null

  const showEditAndLiquidsBtns =
    (labwareOnSlot != null &&
      !isLabwareAnAdapter &&
      !isLabwareTiprack &&
      nestedLabwareOnSlot == null) ||
    nestedLabwareOnSlot != null

  let position = ROBOT_BOTTOM_HALF_SLOTS.includes(location)
    ? BOTTOM_SLOT_Y_POSITION
    : TOP_SLOT_Y_POSITION

  if (showDuplicateBtn && !ROBOT_BOTTOM_HALF_SLOTS.includes(location)) {
    position += showEditAndLiquidsBtns
      ? TOP_SLOT_Y_POSITION_ALL_BUTTONS
      : TOP_SLOT_Y_POSITION_2_BUTTONS
  }

  let nickNameId = labwareOnSlot?.id
  if (nestedLabwareOnSlot != null) {
    nickNameId = nestedLabwareOnSlot.id
  } else if (isOffDeckLocation) {
    nickNameId = location
  }

  const selectionHasLiquids =
    nickNameId != null &&
    liquidLocations[nickNameId] != null &&
    Object.keys(liquidLocations[nickNameId]).length > 0

  const slotOverflowBody = (
    <>
      {showNickNameModal && nickNameId != null ? (
        <EditNickNameModal
          labwareId={nickNameId}
          onClose={() => {
            setShowNickNameModal(false)
            setShowMenuList(false)
          }}
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
            addEquipment(location)
            setShowMenuList(false)
          }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {hasNoItems
              ? t(isOffDeckLocation ? 'add_labware' : 'add_hw_lw')
              : t(isOffDeckLocation ? 'edit_labware' : 'edit_hw_lw')}
          </StyledText>
        </MenuButton>
        {showEditAndLiquidsBtns ? (
          <>
            <MenuButton
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
              onClick={() => {
                if (nestedLabwareOnSlot != null) {
                  dispatch(openIngredientSelector(nestedLabwareOnSlot.id))
                } else if (labwareOnSlot != null) {
                  dispatch(openIngredientSelector(labwareOnSlot.id))
                }
                navigate('/liquids')
              }}
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                {selectionHasLiquids ? t('edit_liquid') : t('add_liquid')}
              </StyledText>
            </MenuButton>
          </>
        ) : null}
        {showDuplicateBtn ? (
          <MenuButton
            onClick={() => {
              if (
                labwareOnSlot != null &&
                !isLabwareAnAdapter &&
                nestedLabwareOnSlot == null
              ) {
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
        ) : null}
        <MenuButton
          disabled={hasNoItems}
          onClick={() => {
            handleClear()
            setShowMenuList(false)
          }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {t(isOffDeckLocation ? 'clear_labware' : 'clear_slot')}
          </StyledText>
        </MenuButton>
      </Flex>
    </>
  )

  return menuListSlotPosition != null ? (
    <RobotCoordsForeignDiv
      x={menuListSlotPosition[0] + 50}
      y={menuListSlotPosition[1] - position}
      width="10.75rem"
      height="11.25rem"
      innerDivProps={{
        style: {
          position: POSITION_ABSOLUTE,
          transform: 'rotate(180deg) scaleX(-1)',
        },
      }}
    >
      {slotOverflowBody}
    </RobotCoordsForeignDiv>
  ) : (
    slotOverflowBody
  )
}

const MenuButton = styled.button`
  background-color: ${COLORS.transparent};
  border-radius: inherit;
  cursor: ${CURSOR_POINTER};
  padding: ${SPACING.spacing8} ${SPACING.spacing12};
  border: none;
  border-radius: inherit;
  &:hover {
    background-color: ${COLORS.blue10};
  }
  &:disabled {
    color: ${COLORS.grey40};
    cursor: ${CURSOR_AUTO};
  }
`
