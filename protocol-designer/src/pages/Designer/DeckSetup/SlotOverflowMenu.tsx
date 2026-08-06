import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  MenuItem,
  NO_WRAP,
  POSITION_ABSOLUTE,
  RobotCoordsForeignDiv,
  StyledText,
  useOnClickOutside,
} from '@opentrons/components'
import {
  FAKE_HOPPER_LOCATION_MAP,
  getFullStackFromLabwares,
  getIsSlotAHopper,
  getTopLocationInStack,
} from '@opentrons/step-generation'

import { getStackerModuleStateFromSlot } from '/protocol-designer/components/organisms/AssignLiquidsModal/utils'
import { updateStackerModuleState } from '/protocol-designer/step-forms/actions'

import {
  ConfirmDeleteEntityInUseModal,
  ConfirmDeleteStagingAreaModal,
  EditNickNameModal,
  getAllLabwareWithoutLids,
} from '../../../components/organisms'
import { useKitchen } from '../../../components/organisms/Kitchen/useKitchen'
import { getRobotType } from '../../../file-data/selectors'
import {
  deleteContainer,
  duplicateLabware,
} from '../../../labware-ingred/actions'
import { getNextAvailableDeckSlot } from '../../../labware-ingred/utils'
import { getSavedStepForms } from '../../../step-forms/selectors'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { getIsLabwareOnSlotInUse } from './utils'

import type { MouseEvent, SetStateAction } from 'react'
import type { CoordinateTuple, DeckSlotId } from '@opentrons/shared-data'
import type { HopperLocationMapKey } from '@opentrons/step-generation'
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
const STAGING_AREA_SLOTS = ['A4', 'B4', 'C4', 'D4']

interface SlotOverflowMenuProps {
  //   can be off-deck id or deck slot or flexStackerAddressableArea or hopper fake slot
  location: DeckSlotId | string
  setShowMenuList: (value: SetStateAction<boolean>) => void
  addEquipment: (slotId: string) => void
  menuListSlotPosition?: CoordinateTuple
  invertY?: true
}
export function SlotOverflowMenu(
  props: SlotOverflowMenuProps
): JSX.Element | null {
  const {
    location,
    setShowMenuList,
    addEquipment,
    menuListSlotPosition,
    invertY = false,
  } = props
  const { t } = useTranslation('starting_deck_state')
  const savedSteps = useSelector(getSavedStepForms)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const [showDeleteLabwareModal, setShowDeleteLabwareModal] =
    useState<boolean>(false)
  const [showDeleteEntityInUseModal, setShowDeleteEntityInUseModal] =
    useState<boolean>(false)
  const [showNickNameModal, setShowNickNameModal] = useState<boolean>(false)
  const overflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      if (
        !showNickNameModal &&
        !showDeleteLabwareModal &&
        !showDeleteEntityInUseModal
      ) {
        setShowMenuList(false)
      }
    },
  })
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const robotType = useSelector(getRobotType)

  const { makeSnackbar } = useKitchen()

  const { labware: deckSetupLabware, modules: deckSetupModules } = deckSetup
  const allLabwareNotLids = getAllLabwareWithoutLids(
    deckSetup,
    Object.keys(deckSetupLabware)
  )
  const topLabwareThatIsNotALid = deckSetupLabware[allLabwareNotLids[0]]
  const isOffDeckLocation = deckSetupLabware[location] != null

  const fullStackOnSlot = getFullStackFromLabwares(deckSetupLabware, location)
  const labwareStackOnSlot =
    fullStackOnSlot?.filter(id => deckSetupLabware[id] != null) ?? []
  const topLabwareOnStackId =
    fullStackOnSlot != null ? getTopLocationInStack(fullStackOnSlot) : null
  const topLabwareOnSlot =
    topLabwareOnStackId != null ? deckSetupLabware[topLabwareOnStackId] : null

  const isSpace =
    getNextAvailableDeckSlot(deckSetup, robotType, topLabwareOnSlot?.def) !=
    null

  const isLabwareTiprack = topLabwareOnSlot?.def.parameters.isTiprack ?? false
  const isLabwareAnAdapter =
    topLabwareOnSlot?.def.allowedRoles?.includes('adapter') ?? false

  const isTiprackAdapter =
    topLabwareOnSlot?.def.parameters.quirks?.includes(
      'tiprackAdapterFor96Channel'
    ) ?? false

  const adapterOnSlot = Object.values(deckSetupLabware).find(
    lw => lw.id === labwareStackOnSlot[1]
  )

  const handleDuplicate = (): void => {
    if (!isSpace) {
      makeSnackbar(t('deck_slots_full') as string)
      return
    }
    dispatch(duplicateLabware(labwareStackOnSlot))
    setShowMenuList(false)
  }
  const isLabwareOnSlotInUse =
    topLabwareOnSlot != null
      ? getIsLabwareOnSlotInUse(savedSteps, topLabwareOnSlot, adapterOnSlot)
      : false

  const isOnHopper = getIsSlotAHopper(location)
  const handleClear = (): void => {
    if (isOnHopper) {
      const slot = FAKE_HOPPER_LOCATION_MAP[location as HopperLocationMapKey]
      const moduleOnSlot = Object.values(deckSetupModules).find(
        module => module.slot === slot
      )
      const stackerModuleState = getStackerModuleStateFromSlot({
        modules: deckSetupModules,
        slot,
      })
      const { labwareInHopper } = stackerModuleState ?? {}
      const labwaresToDelete =
        labwareInHopper?.reduce<string[]>((acc, group) => {
          return [...acc, ...Object.values(group).filter(id => id != null)]
        }, []) ?? []
      // delete all hopper labwares
      labwaresToDelete.forEach(labware => {
        dispatch(deleteContainer({ labwareId: labware }))
      })
      // un-set the stored labware details of the module
      if (moduleOnSlot != null && stackerModuleState != null) {
        dispatch(
          updateStackerModuleState({
            moduleId: moduleOnSlot.id,
            moduleState: {
              ...stackerModuleState,
              storedLabwareDetails: null,
              labwareInHopper: null,
            },
          })
        )
      }
    } else {
      labwareStackOnSlot.forEach(labware => {
        dispatch(deleteContainer({ labwareId: deckSetupLabware[labware].id }))
      })
    }
  }
  const showDuplicateBtn =
    !isLabwareAnAdapter && labwareStackOnSlot.length > 0 && !isOnHopper

  const canRenameLabwareAndEditLiquids =
    !isLabwareAnAdapter &&
    !isLabwareTiprack &&
    !isTiprackAdapter &&
    labwareStackOnSlot.length > 0

  let position = ROBOT_BOTTOM_HALF_SLOTS.includes(location)
    ? BOTTOM_SLOT_Y_POSITION
    : TOP_SLOT_Y_POSITION

  if (showDuplicateBtn && !ROBOT_BOTTOM_HALF_SLOTS.includes(location)) {
    position += canRenameLabwareAndEditLiquids
      ? TOP_SLOT_Y_POSITION_ALL_BUTTONS
      : TOP_SLOT_Y_POSITION_2_BUTTONS
  }

  let nickNameId = topLabwareThatIsNotALid?.id
  if (isOffDeckLocation) {
    nickNameId = location
  }

  const handleConfirmDeleteEntityInUseModal = (): void => {
    handleClear()
    setShowMenuList(false)
    setShowDeleteEntityInUseModal(false)
  }

  const handleClearLabware = (e: MouseEvent): void => {
    if (isLabwareOnSlotInUse) {
      setShowDeleteEntityInUseModal(true)
      e.preventDefault()
      e.stopPropagation()
    } else {
      handleClear()
      setShowMenuList(false)
    }
  }

  const slotOverflowBody = (
    <>
      {isLabwareOnSlotInUse && showDeleteEntityInUseModal ? (
        <ConfirmDeleteEntityInUseModal
          onConfirm={handleConfirmDeleteEntityInUseModal}
          onClose={() => {
            setShowDeleteEntityInUseModal(false)
          }}
        />
      ) : null}
      {showNickNameModal && nickNameId != null ? (
        <EditNickNameModal
          labwareId={nickNameId}
          onClose={() => {
            setShowNickNameModal(false)
            setShowMenuList(false)
          }}
        />
      ) : null}
      {showDeleteLabwareModal ? (
        <ConfirmDeleteStagingAreaModal
          onClose={() => {
            setShowDeleteLabwareModal(false)
            setShowMenuList(false)
          }}
          onConfirm={() => {
            handleClear()
            setShowDeleteLabwareModal(false)
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
        onClick={(e: MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        <MenuItem
          onClick={() => {
            addEquipment(location)
            setShowMenuList(false)
          }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('edit_labware')}
          </StyledText>
        </MenuItem>
        {showDuplicateBtn ? (
          <MenuItem onClick={handleDuplicate}>
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('duplicate')}
            </StyledText>
          </MenuItem>
        ) : null}
        <Divider marginY="0" />
        <MenuItem
          onClick={(e: MouseEvent) => {
            handleClearLabware(e)
          }}
        >
          <StyledText desktopStyle="bodyDefaultRegular">
            {t('clear_labware')}
          </StyledText>
        </MenuItem>
      </Flex>
    </>
  )

  return menuListSlotPosition != null ? (
    <RobotCoordsForeignDiv
      x={
        menuListSlotPosition[0] +
        (STAGING_AREA_SLOTS.includes(location) ? -100 : 50)
      }
      y={menuListSlotPosition[1] - position}
      width="10.75rem"
      height="11.25rem"
      innerDivProps={{
        position: POSITION_ABSOLUTE,
        transform: `rotate(180deg) scaleX(-1) ${invertY ? 'scaleY(-1)' : ''}`,
      }}
    >
      {slotOverflowBody}
    </RobotCoordsForeignDiv>
  ) : (
    slotOverflowBody
  )
}
