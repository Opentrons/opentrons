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
  FLEX_MAX_CONTENT,
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
import {
  ConfirmDeleteEntityInUseModal,
  LabwareCard,
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
    selectedTopLabwareDefUri,
    selectedModuleModel,
    selectedSlot,
    selectedAdapterDefUri,
  } = selectedSlotInfo
  const { slot } = selectedSlot
  const [showSelectLabwareModal, setShowSelectLabwareModal] = useState<boolean>(
    false
  )

  if (slot == null) {
    return null
  }

  const {
    createdTopLabwareForSlot,
    createdAdapterForSlot,
    createdModuleForSlot,
    createdFixtureForSlots,
  } = getSlotInformation({ deckSetup, slot })
  const handleResetToolbox = (): void => {
    dispatch(
      editSlotInfo({
        createdTopLabwareForSlot: null,
        createdAdapterForSlot: null,
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
    createdAdapterForSlot != null && createdTopLabwareForSlot != null

  const hasNoLabware =
    createdAdapterForSlot == null && createdTopLabwareForSlot == null

  const handleClear = (keepExistingLabware = false): void => {
    if (slot !== 'offDeck') {
      //  clear adapter from slot
      if (
        createdAdapterForSlot != null &&
        (!keepExistingLabware ||
          createdAdapterForSlot.labwareDefURI !== selectedAdapterDefUri ||
          //  if top labware changes but adapter doesn't, still delete both
          (createdTopLabwareForSlot?.labwareDefURI === selectedAdapterDefUri &&
            selectedTopLabwareDefUri != null &&
            createdTopLabwareForSlot?.labwareDefURI !==
              selectedTopLabwareDefUri))
      ) {
        dispatch(deleteContainer({ labwareId: createdAdapterForSlot.id }))
      }
      //  clear top labware from slot
      if (
        createdTopLabwareForSlot != null &&
        (!keepExistingLabware ||
          createdTopLabwareForSlot.labwareDefURI !== selectedTopLabwareDefUri)
      ) {
        dispatch(deleteContainer({ labwareId: createdTopLabwareForSlot.id }))
      }
    }
    handleResetToolbox()
  }
  const handleConfirm = (): void => {
    handleClear(true)
    if (
      (slot === 'offDeck' && selectedTopLabwareDefUri != null) ||
      (selectedModuleModel == null && selectedTopLabwareDefUri != null)
      // (createdTopLabwareForSlot?.labwareDefURI !== selectedAdapterDefUri ||
      //   (selectedTopLabwareDefUri != null &&
      //     selectedTopLabwareDefUri !==
      //       createdTopLabwareForSlot?.labwareDefURI)))
    ) {
      //  create adapter + labware on deck
      dispatch(
        createContainer({
          slot,
          labwareDefURI: selectedTopLabwareDefUri,
          adapterUnderLabwareDefURI: selectedAdapterDefUri ?? undefined,
        })
      )
    }
    if (
      selectedModuleModel != null &&
      selectedTopLabwareDefUri != null
      // (createdAdapterForSlot?.labwareDefURI !== selectedAdapterDefUri ||
      //   //  if nested labware changes but labware doesn't, still create both
      //   (createdAdapterForSlot.labwareDefURI === selectedAdapterDefUri &&
      //     createdTopLabwareForSlot?.labwareDefURI !==
      //       selectedTopLabwareDefUri &&
      //     (createdTopLabwareForSlot?.labwareDefURI != null ||
      //       selectedTopLabwareDefUri != null)))
    ) {
      //   create adapter + labware on module
      dispatch(
        createContainerAboveModule({
          slot,
          labwareDefURI: selectedTopLabwareDefUri,
          adapterDefURI: selectedAdapterDefUri ?? undefined,
        })
      )
    }
    setShowSelectLabwareModal(false)
  }

  const isLabwareOnSlotInUse = getIsLabwareOnSlotInUse(
    savedSteps,
    createdAdapterForSlot,
    createdTopLabwareForSlot
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
          <Flex width={FLEX_MAX_CONTENT}>
            <EmptySelectorButton
              textAlignment="left"
              text={t('add_labware')}
              iconName="plus"
              onClick={() => {
                if (slotFull) {
                  makeSnackbar(t('no_space') as string)
                } else {
                  setShowSelectLabwareModal(true)
                }
              }}
            />
          </Flex>
          {hasNoLabware ? (
            <InfoScreen
              content={t('no_labware_added')}
              subContent={t('select_labware_to_add')}
            />
          ) : (
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              {slotFull ? (
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  color={COLORS.grey60}
                >
                  {t('top_slot')}
                </StyledText>
              ) : null}
              {createdTopLabwareForSlot != null ? (
                <LabwareCard
                  labware={createdTopLabwareForSlot}
                  //  TODO: add logic for the lid display name
                />
              ) : null}
              {createdAdapterForSlot != null ? (
                <LabwareCard labware={createdAdapterForSlot} />
              ) : null}
              {slotFull ? (
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  color={COLORS.grey60}
                >
                  {t('bottom_slot')}
                </StyledText>
              ) : null}
            </Flex>
          )}
        </Flex>
      </Toolbox>
    </>
  )
}
