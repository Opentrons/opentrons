import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { css } from 'styled-components'

import {
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  MenuItem,
  NO_WRAP,
  POSITION_ABSOLUTE,
  StyledText,
  useOnClickOutside,
} from '@opentrons/components'
import {
  FAKE_HOPPER_LOCATION_MAP,
  getFullStackFromLabwares,
  getIsSlotAHopper,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import {
  ConfirmDeleteEntityInUseModal,
  EditNickNameModal,
} from '/protocol-designer/components/organisms'
import {
  deleteContainer,
  editSlotInfo,
  multipleIngredientsSelector,
  openIngredientSelector,
} from '/protocol-designer/labware-ingred/actions'
import { selectors } from '/protocol-designer/labware-ingred/selectors'
import { getIsLabwareOnSlotInUse } from '/protocol-designer/pages/Designer/DeckSetup/utils'
import { updateStackerModuleState } from '/protocol-designer/step-forms/actions'
import { getSavedStepForms } from '/protocol-designer/step-forms/selectors'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getModuleIdFromStack } from '/protocol-designer/utils'
import { COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE } from '/protocol-designer/utils/labwareModuleCompatibility'

import { getStackerModuleStateFromSlot } from '../AssignLiquidsModal/utils'
import { LabwareNotCompatibleModal } from '../LabwareNotCompatibleModal'
import { getAllLabwareWithoutLids } from '../utils'

import type { Dispatch, MouseEvent, ReactNode, SetStateAction } from 'react'
import type { HopperLocationMapKey } from '@opentrons/step-generation'
import type { ThunkDispatch } from '/protocol-designer/types'

interface LabwareCardOverflowMenuProps {
  labwareIds: string[]
  setShowOverflowMenu: Dispatch<SetStateAction<boolean>>
  lidId?: string
}
export function LabwareCardOverflowMenu(
  props: LabwareCardOverflowMenuProps
): ReactNode | null {
  const { labwareIds, setShowOverflowMenu, lidId } = props
  const { t } = useTranslation('starting_deck_state')
  const navigate = useNavigate()
  const savedSteps = useSelector(getSavedStepForms)
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const { selectedSlot } = useSelector(selectors.getZoomedInSlotInfo)
  const [showNotCompatibleModal, setShowNotCompatibleModal] =
    useState<boolean>(false)
  const { labware: deckSetupLabware, modules: deckSetupModules } = deckSetup
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const [showDeleteEntityInUseModal, setShowDeleteEntityInUseModal] =
    useState<boolean>(false)
  const [showNickNameModal, setShowNickNameModal] = useState<boolean>(false)
  const overflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      if (
        !showNickNameModal &&
        !showDeleteEntityInUseModal &&
        !showNotCompatibleModal
      ) {
        setShowOverflowMenu(false)
      }
    },
  })
  const stackOnlyHasLids =
    getAllLabwareWithoutLids(deckSetup, labwareIds).length === 0

  const topLabwareId = labwareIds.filter(id => id !== lidId)[0]
  const isAdapter =
    deckSetupLabware[topLabwareId].def.allowedRoles?.includes('adapter')
  const slotName = getSlotInLocationStack(deckSetupLabware[topLabwareId].stack)
  const fullStack = getFullStackFromLabwares(
    deckSetupLabware,
    slotName,
    topLabwareId
  )
  const moduleId = getModuleIdFromStack(fullStack, deckSetupModules)
  const moduleType = moduleId != null ? deckSetupModules[moduleId].type : null
  const labwareAboveAdapter = fullStack[fullStack.indexOf(topLabwareId) - 1]
  const loadNameAboveAdapter = Object.values(deckSetupLabware).find(
    lw => lw.labwareDefURI === labwareAboveAdapter
  )?.def.parameters.loadName
  const isLabwareCompatible =
    loadNameAboveAdapter != null &&
    moduleType != null &&
    COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE[moduleType].includes(
      loadNameAboveAdapter
    )

  const disallowNickname =
    isAdapter ||
    deckSetupLabware[topLabwareId].def.parameters.isTiprack ||
    stackOnlyHasLids ||
    deckSetupLabware[topLabwareId].def.parameters.quirks?.includes(
      'tiprackAdapterFor96Channel'
    ) ||
    labwareIds.length > 2

  const isLabwareOnSlotInUse = getIsLabwareOnSlotInUse(
    savedSteps,
    deckSetupLabware[topLabwareId]
  )
  const handleClear = (): void => {
    labwareIds.forEach(labwareId => {
      dispatch(deleteContainer({ labwareId }))
    })
    if (lidId != null) {
      dispatch(deleteContainer({ labwareId: lidId }))
    }
    const module = moduleId != null ? deckSetupModules[moduleId] : null
    const moduleModel = module?.model ?? null
    const newSlotInfo = {
      ...(moduleModel != null ? { moduleModel } : {}),
      ...(isAdapter === true
        ? { adapterDefURI: null }
        : { labwareDefURI: null, lidDefURI: null, amount: 1 }),
    }
    dispatch(editSlotInfo(newSlotInfo))
    const availableLabware = Object.values(deckSetupLabware).filter(
      lw => lw.id !== topLabwareId && lw.stack.includes(slotName)
    )
    const newLabwareId =
      availableLabware.length > 0 ? availableLabware[0].id : ''
    if (newLabwareId === '') {
      console.log('No more labware in stacker')
      navigate('/designer')
    }
    dispatch(openIngredientSelector(newLabwareId))
    dispatch(multipleIngredientsSelector([newLabwareId]))
  }

  const handleConfirmDeleteEntityInUseModal = (): void => {
    labwareIds.forEach(labwareId => {
      dispatch(deleteContainer({ labwareId }))
    })
    setShowOverflowMenu(false)
    setShowDeleteEntityInUseModal(false)
  }

  const isOnHopper =
    selectedSlot?.slot != null && getIsSlotAHopper(selectedSlot.slot)
  const handleClearLabware = (e: MouseEvent): void => {
    if (isOnHopper) {
      const slot =
        FAKE_HOPPER_LOCATION_MAP[selectedSlot.slot as HopperLocationMapKey]
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
    }

    if (isLabwareOnSlotInUse) {
      setShowDeleteEntityInUseModal(true)
      e.preventDefault()
      e.stopPropagation()
    } else if (
      isAdapter &&
      moduleType != null &&
      labwareAboveAdapter != null &&
      !isLabwareCompatible
    ) {
      setShowNotCompatibleModal(true)
      e.preventDefault()
      e.stopPropagation()
    } else {
      handleClear()
      setShowOverflowMenu(false)
    }
  }

  const handleAddNickname = (e: MouseEvent): void => {
    setShowNickNameModal(true)
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <>
      {isLabwareOnSlotInUse && showDeleteEntityInUseModal ? (
        <ConfirmDeleteEntityInUseModal
          onConfirm={handleConfirmDeleteEntityInUseModal}
          onClose={() => {
            setShowDeleteEntityInUseModal(false)
          }}
        />
      ) : null}
      {showNickNameModal ? (
        <EditNickNameModal
          labwareId={topLabwareId}
          onClose={() => {
            setShowNickNameModal(false)
            setShowOverflowMenu(false)
          }}
        />
      ) : null}
      {showNotCompatibleModal ? (
        <LabwareNotCompatibleModal
          onDone={() => {
            dispatch(deleteContainer({ labwareId: topLabwareId }))
            dispatch(deleteContainer({ labwareId: labwareAboveAdapter }))
            setShowNotCompatibleModal(false)
          }}
          onClose={() => {
            setShowNotCompatibleModal(false)
          }}
          labwareDisplayName={
            deckSetupLabware[labwareAboveAdapter].def.metadata.displayName
          }
        />
      ) : null}
      <Flex
        ref={overflowWrapperRef}
        css={OVERFLOW_STYLE}
        top={40}
        right={4}
        onClick={(e: MouseEvent) => {
          e.preventDefault()
          e.stopPropagation()
        }}
      >
        {!disallowNickname ? (
          <MenuItem
            onClick={(e: MouseEvent) => {
              handleAddNickname(e)
            }}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('rename_lab')}
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
            {t('delete_labware')}
          </StyledText>
        </MenuItem>
      </Flex>
    </>
  )
}

const OVERFLOW_STYLE = css`
  white-space: ${NO_WRAP};
  position: ${POSITION_ABSOLUTE};
  z-index: 2;
  border-radius: ${BORDERS.borderRadius8};
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.2);
  background-color: ${COLORS.white};
  flex-direction: ${DIRECTION_COLUMN};
`
