import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  EmptySelectorButton,
  Flex,
  Icon,
  InfoScreen,
  POSITION_FIXED,
  SPACING,
  StyledText,
  Toolbox,
  TYPOGRAPHY,
} from '@opentrons/components'

import {
  LINK_BUTTON_STYLE,
  NAV_BAR_HEIGHT_REM,
} from '../../../components/atoms'
import { LabwareCard } from '../../../components/molecules'
import {
  ConfirmDeleteEntityInUseModal,
  SelectLabwareModal,
} from '../../../components/organisms'
import { useKitchen } from '../../../components/organisms/Kitchen/hooks'
import { DECK_SETUP_TOOLS_WIDTH_REM } from '../../../constants'
import {
  createContainer,
  deleteContainer,
  editSlotInfo,
  selectZoomedIntoSlot,
} from '../../../labware-ingred/actions'
import { selectors } from '../../../labware-ingred/selectors'
import { createContainerAboveModule } from '../../../step-forms/actions/thunks'
import { getSavedStepForms } from '../../../step-forms/selectors'
import { getDeckSetupForActiveItem } from '../../../top-selectors/labware-locations'
import { getSlotInformation } from '../utils'
import { getIsLabwareOnSlotInUse } from './utils'

import type { ThunkDispatch } from '../../../types'

interface DeckSetupToolsProps {
  onCloseClick: () => void
  position?: string
}

export type CategoryExpand = Record<string, boolean>

export function DeckSetupToolbox(
  props: DeckSetupToolsProps
): JSX.Element | null {
  const { onCloseClick, position = POSITION_FIXED } = props
  const { makeSnackbar } = useKitchen()
  const { t, i18n } = useTranslation(['starting_deck_state', 'shared'])
  const [
    showDeleteEntityInUseModal,
    setShowDeleteEntityInUseModal,
  ] = useState<boolean>(false)
  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const savedSteps = useSelector(getSavedStepForms)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const {
    selectedLabwareDefUri,
    selectedModuleModel,
    selectedSlot,
    selectedNestedLabwareDefUri,
  } = selectedSlotInfo
  const { slot } = selectedSlot
  const [showSelectLabwareModal, setShowSelectLabwareModal] = useState<boolean>(
    false
  )

  if (slot == null) {
    return null
  }

  const {
    createdNestedLabwareForSlot,
    createdLabwareForSlot,
    createdModuleForSlot,
    createdFixtureForSlots,
  } = getSlotInformation({ deckSetup, slot })

  const handleResetToolbox = (): void => {
    dispatch(
      editSlotInfo({
        createdLabwareForSlot: null,
        createdNestedLabwareForSlot: null,
        createdModuleForSlot,
        preSelectedFixture:
          createdFixtureForSlots != null &&
          Object.values(createdFixtureForSlots).some(
            fixture => fixture.name === 'stagingArea'
          )
            ? 'stagingArea'
            : undefined,
      })
    )
  }

  const slotFull =
    (createdLabwareForSlot != null &&
      !createdLabwareForSlot.def.allowedRoles?.includes('adapter')) ||
    (createdLabwareForSlot != null && createdNestedLabwareForSlot != null)

  const hasNoLabware =
    createdLabwareForSlot == null && createdNestedLabwareForSlot == null

  const handleClear = (keepExistingLabware = false): void => {
    if (slot !== 'offDeck') {
      //  clear labware from slot
      if (
        createdLabwareForSlot != null &&
        (!keepExistingLabware ||
          createdLabwareForSlot.labwareDefURI !== selectedLabwareDefUri ||
          //  if nested labware changes but labware doesn't, still delete both
          (createdLabwareForSlot.labwareDefURI === selectedLabwareDefUri &&
            selectedNestedLabwareDefUri != null &&
            createdNestedLabwareForSlot?.labwareDefURI !==
              selectedNestedLabwareDefUri))
      ) {
        dispatch(deleteContainer({ labwareId: createdLabwareForSlot.id }))
      }
      //  clear nested labware from slot
      if (
        createdNestedLabwareForSlot != null &&
        (!keepExistingLabware ||
          createdNestedLabwareForSlot.labwareDefURI !==
            selectedNestedLabwareDefUri)
      ) {
        dispatch(deleteContainer({ labwareId: createdNestedLabwareForSlot.id }))
      }
    }
    handleResetToolbox()
  }
  const handleConfirm = (): void => {
    handleClear()
    if (
      (slot === 'offDeck' && selectedLabwareDefUri != null) ||
      (selectedModuleModel == null &&
        selectedLabwareDefUri != null &&
        (createdLabwareForSlot?.labwareDefURI !== selectedLabwareDefUri ||
          (selectedNestedLabwareDefUri != null &&
            selectedNestedLabwareDefUri !==
              createdNestedLabwareForSlot?.labwareDefURI)))
    ) {
      //  create adapter + labware on deck
      dispatch(
        createContainer({
          slot,
          labwareDefURI: selectedNestedLabwareDefUri ?? selectedLabwareDefUri,
          adapterUnderLabwareDefURI:
            selectedNestedLabwareDefUri == null
              ? undefined
              : selectedLabwareDefUri,
        })
      )
    }
    if (
      selectedModuleModel != null &&
      selectedLabwareDefUri != null &&
      (createdLabwareForSlot?.labwareDefURI !== selectedLabwareDefUri ||
        //  if nested labware changes but labware doesn't, still create both
        (createdLabwareForSlot.labwareDefURI === selectedLabwareDefUri &&
          createdNestedLabwareForSlot?.labwareDefURI !==
            selectedNestedLabwareDefUri &&
          (createdNestedLabwareForSlot?.labwareDefURI != null ||
            selectedNestedLabwareDefUri != null)))
    ) {
      //   create adapter + labware on module
      dispatch(
        createContainerAboveModule({
          slot,
          labwareDefURI: selectedLabwareDefUri,
          nestedLabwareDefURI: selectedNestedLabwareDefUri ?? undefined,
        })
      )
    }
    setShowSelectLabwareModal(false)
  }

  const isLabwareOnSlotInUse = getIsLabwareOnSlotInUse(
    savedSteps,
    createdLabwareForSlot,
    createdNestedLabwareForSlot
  )

  const positionStyles =
    position === POSITION_FIXED
      ? {
          right: SPACING.spacing12,
          top: `calc(${NAV_BAR_HEIGHT_REM}rem + ${SPACING.spacing12})`,
        }
      : {}

  const handleConfirmDeleteEntityInUseModal = (): void => {
    handleClear()
    handleResetToolbox()
    setShowDeleteEntityInUseModal(false)
  }
  const handleClose = (): void => {
    onCloseClick()
    dispatch(selectZoomedIntoSlot({ slot: null, cutout: null }))
    handleResetToolbox()
  }
  const handleConfirmSelection = (): void => {
    handleConfirm()
  }
  const handleClearSelection = (): void => {
    if (isLabwareOnSlotInUse) {
      setShowDeleteEntityInUseModal(true)
    } else {
      handleClear()
    }
  }

  return (
    <>
      {showSelectLabwareModal ? (
        <SelectLabwareModal
          slot={slot}
          onClose={() => {
            setShowSelectLabwareModal(false)
          }}
          onConfirm={handleConfirmSelection}
        />
      ) : null}
      {isLabwareOnSlotInUse && showDeleteEntityInUseModal ? (
        <ConfirmDeleteEntityInUseModal
          onConfirm={handleConfirmDeleteEntityInUseModal}
          onClose={() => {
            setShowDeleteEntityInUseModal(false)
          }}
        />
      ) : null}
      <Toolbox
        height={`calc(100vh - ${NAV_BAR_HEIGHT_REM}rem - 2 * ${SPACING.spacing12})`}
        width={`${DECK_SETUP_TOOLS_WIDTH_REM}rem`}
        position={position}
        {...positionStyles}
        title={
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            <DeckInfoLabel
              deckLabel={
                slot === 'offDeck'
                  ? i18n.format(t('off_deck_title'), 'upperCase')
                  : slot
              }
            />
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t('customize_slot')}
            </StyledText>
          </Flex>
        }
        secondaryHeaderButton={
          <Btn
            onClick={handleClearSelection}
            css={LINK_BUTTON_STYLE}
            textDecoration={TYPOGRAPHY.textDecorationUnderline}
          >
            <StyledText desktopStyle="bodyDefaultRegular">
              {t('clear')}
            </StyledText>
          </Btn>
        }
        closeButton={<Icon size="2rem" name="close" />}
        onCloseClick={handleClose}
        onConfirmClick={handleClose}
        confirmButtonText={t('done')}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
          <Flex width="max-content">
            <EmptySelectorButton
              textAlignment="left"
              text={'Add labware'}
              iconName="plus"
              onClick={() => {
                if (slotFull) {
                  makeSnackbar('no space on slot')
                } else {
                  setShowSelectLabwareModal(true)
                }
              }}
            />
          </Flex>
          {hasNoLabware ? (
            <InfoScreen
              content="no labware added"
              subContent="Select labware to add to slot"
            />
          ) : (
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={COLORS.grey60}
              >
                Top of slot
              </StyledText>
              {createdNestedLabwareForSlot != null ? (
                <LabwareCard labware={createdNestedLabwareForSlot} />
              ) : null}
              {createdLabwareForSlot != null ? (
                <LabwareCard labware={createdLabwareForSlot} />
              ) : null}
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={COLORS.grey60}
              >
                Bottom of slot
              </StyledText>
            </Flex>
          )}
        </Flex>
      </Toolbox>
    </>
  )
}
