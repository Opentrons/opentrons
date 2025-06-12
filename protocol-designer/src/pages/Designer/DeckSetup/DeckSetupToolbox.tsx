import { useMemo, useState } from 'react'
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
import { ABSORBANCE_READER_V1 } from '@opentrons/shared-data'

import {
  LINK_BUTTON_STYLE,
  NAV_BAR_HEIGHT_REM,
} from '../../../components/atoms'
import {
  ConfirmDeleteEntityInUseModal,
  LabwareCard,
  SelectLabwareModal,
} from '../../../components/organisms'
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
    selectedTopLabware,
    selectedModuleModel,
    selectedSlot,
    selectedAdapterDefURI,
    selectedLidLabware,
  } = selectedSlotInfo
  const { slot } = selectedSlot
  const [showSelectLabwareModal, setShowSelectLabwareModal] = useState<boolean>(
    false
  )
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

  const offDeckLabware = deckSetup.labware[slot]
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

  const slotFull =
    (createdAdapterForSlot != null && createdStackForSlot.length > 0) ||
    (createdStackForSlot.length > 0 && deckSetup.labware[slot] != null)

  const hasNoLabware =
    (createdAdapterForSlot == null && createdStackForSlot.length === 0) ||
    (createdStackForSlot.length === 0 && deckSetup.labware[slot] != null)
  const handleClear = (): void => {
    if (slot !== 'offDeck' && offDeckLabware == null) {
      if (createdAdapterForSlot != null) {
        dispatch(deleteContainer({ labwareId: createdAdapterForSlot.id }))
      }
      createdStackForSlot.forEach(itemId =>
        dispatch(deleteContainer({ labwareId: itemId }))
      )
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
    //  handle clear for if you are changing the adapter/labware combo
    if (!isOffDeck) {
      handleClear()
    }
    if (hasModule) {
      dispatch(
        createContainerAboveModule({
          slot,
          labwareDefURIStack: [
            ...(selectedAdapterDefURI != null ? [selectedAdapterDefURI] : []),
            ...(selectedTopLabware.labwareDefURI != null
              ? [selectedTopLabware.labwareDefURI]
              : []),
            ...(selectedLidLabware != null ? [selectedLidLabware] : []),
          ],
        })
      )
    } else {
      dispatch(
        createContainer({
          slot,
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
                slot === 'offDeck' || deckSetup.labware[slot] != null
                  ? i18n.format(t('off_deck_title'), 'upperCase')
                  : slot
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
                text={t('add_labware')}
                iconName="plus"
                onClick={() => {
                  setShowSelectLabwareModal(true)
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
              {slotFull ? (
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  color={COLORS.grey60}
                >
                  {t('top_slot')}
                </StyledText>
              ) : null}
              {createdStackForSlot.length > 0 ? (
                <LabwareCard
                  labware={
                    deckSetup.labware[
                      createdStackForSlot[createdStackForSlot.length - 1]
                    ]
                  }
                  lidDisplayName={
                    createdLidForSlot != null &&
                    createdStackForSlot.includes(createdLidForSlot?.id)
                      ? undefined
                      : createdLidForSlot?.def.metadata.displayName
                  }
                  quantity={createdStackForSlot.length}
                />
              ) : null}
              {createdAdapterForSlot != null ? (
                <LabwareCard labware={createdAdapterForSlot} quantity={1} />
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
