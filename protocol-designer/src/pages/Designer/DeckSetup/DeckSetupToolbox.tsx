import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  ALIGN_CENTER,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  EmptySelectorButton,
  Flex,
  FLEX_MAX_CONTENT,
  Icon,
  InfoScreen,
  POSITION_FIXED,
  RobotInfoLabel,
  SPACING,
  StyledText,
  Toolbox,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  ABSORBANCE_READER_V1,
  FLEX_STACKER_MODULE_TYPE,
  getModuleType,
  VACUUM_MODULE_TYPE,
} from '@opentrons/shared-data'
import {
  FAKE_HOPPER_LOCATION_MAP,
  getIsSlotAHopper,
  getIsSlotAVacuumDock,
} from '@opentrons/step-generation'

import { getColumnFromWellName } from '/protocol-designer/pages/Designer/ProtocolSteps/StepForm/PipetteFields/TipSelectionWizard/utils'

import {
  LINK_BUTTON_STYLE,
  NAV_BAR_HEIGHT_REM,
} from '../../../components/atoms'
import {
  ConfirmDeleteEntityInUseModal,
  LabwareCard,
  SelectLabwareModal,
} from '../../../components/organisms'
import { useKitchen } from '../../../components/organisms/Kitchen/useKitchen'
import {
  DECK_SETUP_TOOLS_WIDTH_REM,
  VACUUM_DOCK_DISPLAY_LOCATION,
} from '../../../constants'
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
import { getIsLabwareOnSlotInUse, getIsVacuumModuleFull } from './utils'

import type { HopperLocationMapKey } from '@opentrons/step-generation'
import type { CreateContainerAboveModuleArgs } from '../../../step-forms/actions/thunks'
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
  const { t, i18n } = useTranslation(['starting_deck_state', 'shared'])
  const [showDeleteEntityInUseModal, setShowDeleteEntityInUseModal] =
    useState<boolean>(false)
  const selectedSlotInfo = useSelector(selectors.getZoomedInSlotInfo)
  const savedSteps = useSelector(getSavedStepForms)
  const dispatch = useDispatch<ThunkDispatch<any>>()
  const deckSetup = useSelector(getDeckSetupForActiveItem)
  const {
    selectedTopLabware,
    selectedModuleModel,
    selectedSlot,
    selectedAdapterDefURI,
    selectedLidLabware,
  } = selectedSlotInfo
  const { slot } = selectedSlot
  const [showSelectLabwareModal, setShowSelectLabwareModal] =
    useState<boolean>(false)
  const { makeSnackbar } = useKitchen()
  const isOnPlateReader = selectedModuleModel === ABSORBANCE_READER_V1
  const {
    createdAdapterForSlot,
    createdModuleForSlot,
    createdFixtureForSlots,
    createdStackForSlot,
    createdLidForSlot,
  } = useMemo(() => {
    return getSlotInformation({
      deckSetup,
      slot: slot ?? 'A1',
    })
  }, [deckSetup, slot])

  if (slot == null) {
    return null
  }
  const isHopperSlot = getIsSlotAHopper(slot)
  const isVacuumDockSlot = getIsSlotAVacuumDock(slot)
  const realSlot = slot
  const offDeckLabware = deckSetup.labware[slot]
  const isVacuumModule =
    selectedModuleModel != null &&
    getModuleType(selectedModuleModel) === VACUUM_MODULE_TYPE
  const hasVacuumModuleCreated =
    createdModuleForSlot != null &&
    getModuleType(createdModuleForSlot.model) === VACUUM_MODULE_TYPE
  const handleResetToolbox = (): void => {
    dispatch(
      editSlotInfo({
        labwareDefURI: null,
        adapterDefURI: null,
        moduleModel: createdModuleForSlot?.model,
        fixture:
          createdFixtureForSlots != null &&
          Object.values(createdFixtureForSlots).some(
            fixture => fixture.name === 'stagingArea'
          )
            ? 'stagingArea'
            : undefined,
        lidDefURI: null,
        amount: 1,
      })
    )
  }
  const labwareInHopper =
    createdModuleForSlot?.type === FLEX_STACKER_MODULE_TYPE &&
    isHopperSlot &&
    'labwareInHopper' in createdModuleForSlot.moduleState
      ? createdModuleForSlot.moduleState.labwareInHopper
      : null

  const isVacuumModuleFull =
    hasVacuumModuleCreated &&
    getIsVacuumModuleFull(createdStackForSlot, deckSetup.labware)

  // Check if vacuum dock is full by checking both stack and adapter for collar
  // The dock and main module areas are independently managed
  // Note: The collar might be in createdAdapterForSlot instead of createdStackForSlot
  const isVacuumDockFull =
    isVacuumDockSlot &&
    (getIsVacuumModuleFull(createdStackForSlot, deckSetup.labware) ||
      (createdAdapterForSlot != null &&
        getIsVacuumModuleFull([createdAdapterForSlot.id], deckSetup.labware)))

  const slotFull =
    ((createdAdapterForSlot != null && createdStackForSlot.length > 0) ||
      (createdStackForSlot.length > 0 && deckSetup.labware[slot] != null)) &&
    !isVacuumModule

  const hasNoLabware =
    (createdAdapterForSlot == null && createdStackForSlot.length === 0) ||
    (createdStackForSlot.length === 0 && deckSetup.labware[slot] != null)
  const handleClear = (): void => {
    if (isHopperSlot) {
      const labwareIdsToDelete = (labwareInHopper ?? []).reduce<string[]>(
        (acc, group) => {
          return [...acc, ...Object.values(group).filter(id => id != null)]
        },
        []
      )
      labwareIdsToDelete.forEach(labwareId => {
        dispatch(deleteContainer({ labwareId: labwareId }))
      })
    } else if (slot !== 'offDeck' && offDeckLabware == null) {
      if (createdAdapterForSlot != null) {
        dispatch(deleteContainer({ labwareId: createdAdapterForSlot.id }))
      }
      createdStackForSlot.forEach(itemId =>
        dispatch(deleteContainer({ labwareId: itemId }))
      )
      if (
        createdLidForSlot != null &&
        !createdStackForSlot.includes(createdLidForSlot.id)
      ) {
        dispatch(deleteContainer({ labwareId: createdLidForSlot.id }))
      }
    } else {
      createdStackForSlot.forEach(itemId =>
        dispatch(deleteContainer({ labwareId: itemId }))
      )
      dispatch(selectZoomedIntoSlot({ slot: 'offDeck', cutout: null }))
    }
    handleResetToolbox()
  }
  const handleConfirm = (): void => {
    const isOffDeck = slot === 'offDeck'
    const hasModule = selectedModuleModel != null
    const isVacuumModule =
      selectedModuleModel != null &&
      getModuleType(selectedModuleModel) === VACUUM_MODULE_TYPE
    const isModuleStacker =
      selectedModuleModel != null &&
      getModuleType(selectedModuleModel) === FLEX_STACKER_MODULE_TYPE
    const isOnShuttle = !isHopperSlot && isModuleStacker
    const vacuumModuleHasLabware =
      isVacuumModule &&
      (createdAdapterForSlot != null || createdStackForSlot.length > 0)

    //  handle clear for if you are changing the adapter/labware combo
    // For vacuum modules, use additive behavior (never clear)
    if (!isOffDeck && !isVacuumModule) {
      handleClear()
    }
    //  NOTE: labware on the Flex Stacker shuttle is not on any module ;)
    if (hasModule && !vacuumModuleHasLabware) {
      let flexStackerInfo: CreateContainerAboveModuleArgs['stackerInfo']
      if (isModuleStacker) {
        flexStackerInfo = isOnShuttle
          ? {
              stackerPosition: 'shuttle',
            }
          : {
              stackerPosition: 'hopper',
              amount: selectedTopLabware.amount,
            }
      }
      dispatch(
        createContainerAboveModule({
          slot: isHopperSlot
            ? FAKE_HOPPER_LOCATION_MAP[slot as HopperLocationMapKey]
            : slot,
          labwareDefURIGroup: {
            adapterDefURI: selectedAdapterDefURI,
            topLabwareDefURI: selectedTopLabware.labwareDefURI,
            lidDefURI: selectedLidLabware,
          },
          stackerInfo: flexStackerInfo,
        })
      )
    } else if (vacuumModuleHasLabware) {
      // For vacuum module with existing labware, add new labware on top
      const topLabwareId =
        createdStackForSlot.length > 0
          ? createdStackForSlot[0] // Get the top item (first in array)
          : createdAdapterForSlot?.id
      dispatch(
        createContainer({
          slot: topLabwareId,
          labwareDefURIStack: [
            ...(selectedAdapterDefURI != null ? [selectedAdapterDefURI] : []),
            ...(selectedTopLabware.labwareDefURI != null
              ? [selectedTopLabware.labwareDefURI]
              : []),
          ],
        })
      )
    } else {
      dispatch(
        createContainer({
          slot: realSlot,
          labwareDefURIStack: [
            ...(selectedAdapterDefURI != null ? [selectedAdapterDefURI] : []),
            ...(selectedTopLabware.labwareDefURI != null
              ? Array(selectedTopLabware.amount).fill(
                  selectedTopLabware.labwareDefURI.toString()
                )
              : []),
            ...(selectedLidLabware != null ? [selectedLidLabware] : []),
          ],
        })
      )
    }

    setShowSelectLabwareModal(false)
  }

  const isLabwareOnSlotInUse = getIsLabwareOnSlotInUse(
    savedSteps,
    createdAdapterForSlot,
    deckSetup.labware[createdStackForSlot[0]]
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

  let displaySlot = slot
  if (getIsSlotAHopper(slot)) {
    displaySlot = t('shared:stacker', { slot: getColumnFromWellName(slot) })
  } else if (getIsSlotAVacuumDock(slot)) {
    displaySlot = VACUUM_DOCK_DISPLAY_LOCATION
  }

  const isMultiStack = createdStackForSlot.length > 1
  const shouldShowTopBottomOfSlotLabels = slotFull || isMultiStack

  return (
    <>
      {showSelectLabwareModal ? (
        <SelectLabwareModal
          slot={slot}
          onClose={() => {
            setShowSelectLabwareModal(false)
          }}
          onConfirm={handleConfirmSelection}
          slotFull={slotFull}
          moduleHasLabware={
            isVacuumModule &&
            (createdAdapterForSlot != null || createdStackForSlot.length > 0)
          }
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
            <RobotInfoLabel
              deckLabel={
                slot === 'offDeck' || deckSetup.labware[slot] != null
                  ? i18n.format(t('off_deck_title'), 'upperCase')
                  : displaySlot
              }
            />
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t('edit_labware')}
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
          {isOnPlateReader ? null : (
            <Flex width={FLEX_MAX_CONTENT}>
              <EmptySelectorButton
                textAlignment="left"
                text={
                  hasNoLabware || hasVacuumModuleCreated || isVacuumDockSlot
                    ? t('add_labware')
                    : t('replace_labware')
                }
                iconName="plus"
                onClick={() => {
                  if (
                    (hasVacuumModuleCreated && isVacuumModuleFull) ||
                    isVacuumDockFull
                  ) {
                    makeSnackbar(t('labware_limit_reached') as string)
                  } else {
                    setShowSelectLabwareModal(true)
                  }
                }}
              />
            </Flex>
          )}
          {hasNoLabware ? (
            <InfoScreen
              content={t(
                isOnPlateReader ? 'cant_add_labware' : 'no_labware_added'
              )}
              subContent={t(
                isOnPlateReader
                  ? 'plate_reader_labware'
                  : 'select_labware_to_add'
              )}
            />
          ) : (
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
              {shouldShowTopBottomOfSlotLabels ? (
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  color={COLORS.grey60}
                >
                  {t('top_slot')}
                </StyledText>
              ) : null}
              {createdStackForSlot.length > 0
                ? createdStackForSlot.map((labwareId, index) => (
                    <LabwareCard
                      key={labwareId}
                      labware={deckSetup.labware[labwareId]}
                      {...(createdLidForSlot != null &&
                      createdStackForSlot.includes(createdLidForSlot?.id) &&
                      labwareId === createdLidForSlot?.id
                        ? {}
                        : index === 0 && createdLidForSlot != null
                          ? { lidId: createdLidForSlot?.id }
                          : {})}
                      quantity={
                        labwareInHopper != null && index === 0
                          ? labwareInHopper.length
                          : 1
                      }
                      location={slot}
                    />
                  ))
                : null}
              {createdAdapterForSlot != null && !hasVacuumModuleCreated ? (
                <LabwareCard
                  labware={createdAdapterForSlot}
                  quantity={1}
                  location={slot}
                />
              ) : null}
              {shouldShowTopBottomOfSlotLabels ? (
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
