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
import { getTopLocationInStack } from '@opentrons/step-generation'

import {
  ConfirmDeleteEntityInUseModal,
  EditNickNameModal,
} from '../../../components/organisms'
import { deleteContainer } from '../../../labware-ingred/actions'
import { getIsLabwareOnSlotInUse } from '../../../pages/Designer/DeckSetup/utils'
import { getSavedStepForms } from '../../../step-forms/selectors'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'

import type { Dispatch, MouseEvent, SetStateAction } from 'react'
import type { ThunkDispatch } from '../../../types'

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
  const { labware: deckSetupLabware } = deckSetup
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const [
    showDeleteEntityInUseModal,
    setShowDeleteEntityInUseModal,
  ] = useState<boolean>(false)
  const [showNickNameModal, setShowNickNameModal] = useState<boolean>(false)
  const overflowWrapperRef = useOnClickOutside<HTMLDivElement>({
    onClickOutside: () => {
      if (!showNickNameModal && !showDeleteEntityInUseModal) {
        setShowOverflowMenu(false)
      }
    },
  })
  const topLabwareId = labwareIds[0]
  const disallowNickname =
    labwareIds.length > 1 ||
    deckSetupLabware[topLabwareId].def.allowedRoles?.includes('adapter') ||
    deckSetupLabware[topLabwareId].def.parameters.isTiprack ||
    deckSetupLabware[topLabwareId].def.parameters.quirks?.includes(
      'tiprackAdapterFor96Channel'
    )

  const isLabwareOnSlotInUse =
    topLabwareId != null
      ? getIsLabwareOnSlotInUse(savedSteps, deckSetupLabware[topLabwareId])
      : false

  const handleClear = (): void => {
    labwareIds.forEach(id => {
      dispatch(deleteContainer({ labwareId: deckSetupLabware[id].id }))
    })
  }

  const handleConfirmDeleteEntityInUseModal = (): void => {
    handleClear()
    setShowOverflowMenu(false)
    setShowDeleteEntityInUseModal(false)
  }

  const handleClearLabware = (e: MouseEvent): void => {
    if (isLabwareOnSlotInUse) {
      setShowDeleteEntityInUseModal(true)
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
          labwareId={labwareIds[0]}
          onClose={() => {
            setShowNickNameModal(false)
            setShowOverflowMenu(false)
          }}
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
