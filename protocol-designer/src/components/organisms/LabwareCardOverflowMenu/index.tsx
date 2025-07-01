import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
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
  getFullStackFromLabwares,
  getSlotInLocationStack,
} from '@opentrons/step-generation'

import {
  ConfirmDeleteEntityInUseModal,
  EditNickNameModal,
} from '/protocol-designer/components/organisms'
import {
  deleteContainer,
  editSlotInfo,
} from '/protocol-designer/labware-ingred/actions'
import { getIsLabwareOnSlotInUse } from '/protocol-designer/pages/Designer/DeckSetup/utils'
import { getSavedStepForms } from '/protocol-designer/step-forms/selectors'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getModuleIdFromStack } from '/protocol-designer/utils'
import { COMPATIBLE_LABWARE_ALLOWLIST_BY_MODULE_TYPE } from '/protocol-designer/utils/labwareModuleCompatibility'

import { LabwareNotCompatibleModal } from '../LabwareNotCompatibleModal'

import type { Dispatch, MouseEvent, SetStateAction } from 'react'
import type { ThunkDispatch } from '/protocol-designer/types'

interface LabwareCardOverflowMenuProps {
  labwareIds: string[]
  setShowOverflowMenu: Dispatch<SetStateAction<boolean>>
}
export function LabwareCardOverflowMenu(
  props: LabwareCardOverflowMenuProps
): JSX.Element | null {
  const { labwareIds, setShowOverflowMenu } = props
  const { t } = useTranslation('starting_deck_state')
  const savedSteps = useSelector(getSavedStepForms)
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const [showNotCompatibleModal, setShowNotCompatibleModal] = useState<boolean>(
    false
  )
  const { labware: deckSetupLabware, modules: deckSetupModules } = deckSetup
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const [
    showDeleteEntityInUseModal,
    setShowDeleteEntityInUseModal,
  ] = useState<boolean>(false)
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
  const topLabwareId = labwareIds[0]
  const isAdapter = deckSetupLabware[topLabwareId].def.allowedRoles?.includes(
    'adapter'
  )
  const slotName = getSlotInLocationStack(deckSetupLabware[topLabwareId].stack)
  const fullStack = getFullStackFromLabwares(deckSetupLabware, slotName)
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
    if (isAdapter) {
      dispatch(
        editSlotInfo({
          adapterDefURI: null,
        })
      )
    } else {
      dispatch(
        editSlotInfo({
          labwareDefURI: null,
          lidDefURI: null,
          amount: 1,
        })
      )
    }
  }
  const handleConfirmDeleteEntityInUseModal = (): void => {
    labwareIds.forEach(labwareId => {
      dispatch(deleteContainer({ labwareId }))
    })
    setShowOverflowMenu(false)
    setShowDeleteEntityInUseModal(false)
  }

  const handleClearLabware = (e: MouseEvent): void => {
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
