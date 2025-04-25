import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Btn,
  DeckInfoLabel,
  Flex,
  Icon,
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
import { ConfirmDeleteEntityInUseModal } from '../../../components/organisms'
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
import { ALL_ORDERED_CATEGORIES } from './constants'
import { LabwareTools } from './LabwareTools'
import { getIsLabwareOnSlotInUse } from './utils'

import type { ThunkDispatch } from '../../../types'

interface DeckSetupToolsProps {
  onCloseClick: () => void
  setHoveredLabware: (defUri: string | null) => void
  position?: string
}

export type CategoryExpand = Record<string, boolean>

export function DeckSetupToolbox(
  props: DeckSetupToolsProps
): JSX.Element | null {
  const { onCloseClick, setHoveredLabware, position = POSITION_FIXED } = props
  const { t, i18n } = useTranslation(['starting_deck_state', 'shared'])
  const [showDeleteEntityInUseModal, setShowDeleteEntityInUseModal] = useState<
    'clear' | 'confirm' | null
  >(null)
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

  const setAllCategories = (state: boolean): Record<string, boolean> =>
    ALL_ORDERED_CATEGORIES.reduce<Record<string, boolean>>(
      (acc, category) => ({ ...acc, [category]: state }),
      {}
    )
  const allCategoriesExpanded = setAllCategories(true)
  const allCategoriesCollapsed = setAllCategories(false)
  const [
    areCategoriesExpanded,
    setAreCategoriesExpanded,
  ] = useState<CategoryExpand>(allCategoriesCollapsed)
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    if (searchTerm !== '') {
      setAreCategoriesExpanded(allCategoriesExpanded)
    } else {
      setAreCategoriesExpanded(allCategoriesCollapsed)
    }
  }, [searchTerm])

  const handleCollapseAllCategories = (): void => {
    setAreCategoriesExpanded(allCategoriesCollapsed)
  }
  const handleResetSearchTerm = (): void => {
    setSearchTerm('')
  }

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

  const handleResetLabwareTools = (): void => {
    handleCollapseAllCategories()
    handleResetSearchTerm()
  }

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
    handleResetLabwareTools()
  }
  const handleConfirm = (): void => {
    //  clear labware first before recreating them
    handleClear(true)
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
    handleResetToolbox()
    dispatch(selectZoomedIntoSlot({ slot: null, cutout: null }))
    onCloseClick()
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
    if (showDeleteEntityInUseModal === 'confirm') {
      handleConfirm()
    } else {
      handleClear()
      handleResetToolbox()
    }
    setShowDeleteEntityInUseModal(null)
  }
  const handleClose = (): void => {
    onCloseClick()
    dispatch(selectZoomedIntoSlot({ slot: null, cutout: null }))
    handleResetToolbox()
  }
  const handleConfirmSelection = (): void => {
    if (isLabwareOnSlotInUse) {
      setShowDeleteEntityInUseModal('confirm')
    } else {
      handleConfirm()
    }
  }
  const handleClearSelection = (): void => {
    if (isLabwareOnSlotInUse) {
      setShowDeleteEntityInUseModal('clear')
    } else {
      handleClear()
      handleResetToolbox()
    }
  }

  return (
    <>
      {isLabwareOnSlotInUse && showDeleteEntityInUseModal != null ? (
        <ConfirmDeleteEntityInUseModal
          onConfirm={handleConfirmDeleteEntityInUseModal}
          onClose={() => {
            setShowDeleteEntityInUseModal(null)
          }}
          type={
            showDeleteEntityInUseModal === 'confirm' ? 'reconfigure' : 'clear'
          }
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
        onConfirmClick={handleConfirmSelection}
        confirmButtonText={t('done')}
      >
        <LabwareTools
          setHoveredLabware={setHoveredLabware}
          slot={slot}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          areCategoriesExpanded={areCategoriesExpanded}
          setAreCategoriesExpanded={setAreCategoriesExpanded}
          handleReset={handleResetLabwareTools}
        />
      </Toolbox>
    </>
  )
}
