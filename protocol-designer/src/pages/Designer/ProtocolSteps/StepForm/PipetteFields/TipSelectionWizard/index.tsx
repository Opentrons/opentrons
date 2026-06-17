import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { getDeckDefFromRobotType } from '@opentrons/shared-data'
import { DIRTY, EMPTY } from '@opentrons/step-generation'

import { useKitchen } from '/protocol-designer/components/organisms/Kitchen/useKitchen'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { getInvariantContext } from '/protocol-designer/step-forms/selectors'
import {
  getDeckSetupForActiveItem,
  getRobotStateAtActiveItem,
} from '/protocol-designer/top-selectors/labware-locations'

import { INACCESSIBLE_TOO_MANY_PICKUPS } from './constants'
import { SelectTiprack } from './SelectTiprack'
import { SelectTips } from './SelectTips'
import { TipSelectionModal } from './TipSelectionModal'
import {
  getAreAnyMatchingTipracksSelectable,
  getIsTiprackSelectableAndValid,
} from './utils'

import type { Dispatch, SetStateAction } from 'react'
import type {
  NozzleConfigurationStyle,
  PrimaryNozzleConfigurationStyle,
} from '@opentrons/shared-data'
import type {
  AccessibilityStatus,
  TipSelectionBannerReason,
  TipSelectionBaseProps,
} from './types'

const NUM_TOTAL_STEPS = 2

interface TipSelectionWizardProps {
  formTiprackUri: string
  setShowTipSelectionModal: Dispatch<SetStateAction<boolean>>
  pipetteId: string
  nozzles: NozzleConfigurationStyle
  primaryNozzle: PrimaryNozzleConfigurationStyle
  numPickups: number
  tiprackSelected: string | null
  updateFormTiprackSelected: Dispatch<SetStateAction<string | null>>
  updateFormTipsSelected: Dispatch<SetStateAction<string[][]>>
  selectedTips: string[][]
  setSelectedTips: Dispatch<SetStateAction<string[][]>>
  validTiprackIds: string[]
  tipAccessibilityStatus: Record<string, Record<string, AccessibilityStatus>>
}

export function TipSelectionWizard(
  props: TipSelectionWizardProps
): JSX.Element {
  const {
    setShowTipSelectionModal,
    formTiprackUri,
    pipetteId,
    nozzles,
    numPickups,
    tiprackSelected,
    updateFormTiprackSelected,
    updateFormTipsSelected,
    selectedTips,
    setSelectedTips,
    validTiprackIds,
    tipAccessibilityStatus,
    primaryNozzle,
  } = props
  const { t } = useTranslation('tip_selection')
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [selectedTiprackId, setSelectedTiprackId] = useState<string | null>(
    tiprackSelected
  )
  const [showErrorBanner, setShowErrorBanner] = useState<boolean>(
    selectedTips.length > 0
  )
  const robotState = useSelector(getRobotStateAtActiveItem)
  const tipState =
    selectedTiprackId != null
      ? robotState?.tipState.tipracks[selectedTiprackId]
      : null
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const { labware: activeDeckSetupLabware } = activeDeckSetup
  const { pipetteEntities, labwareEntities } = useSelector(getInvariantContext)
  const { spec: pipetteSpecs } = pipetteEntities[pipetteId]
  const robotType = useSelector(getRobotType)
  const { makeSnackbar } = useKitchen()

  const deckDef = getDeckDefFromRobotType(robotType)

  const selectedTiprackStatus =
    selectedTiprackId != null ? tipAccessibilityStatus[selectedTiprackId] : {}

  const isAnySelectedWellUsed =
    tipState != null &&
    selectedTips.some(group => {
      const primary = group[0]
      const affectedWells = selectedTiprackStatus[primary]?.affectedWells
      return affectedWells != null
        ? affectedWells.some(tip => tipState[tip] === DIRTY)
        : group.some(tip => tipState[tip] === DIRTY)
    })
  const handleSave = (): void => {
    updateFormTiprackSelected(selectedTiprackId)
    updateFormTipsSelected(selectedTips)
    setShowTipSelectionModal(false)
  }

  const areAnyMatchingTipracksSelectable = getAreAnyMatchingTipracksSelectable({
    allLabware: Object.values(activeDeckSetupLabware),
    formTiprackUri,
    pipetteSpecs,
    nozzles,
    labwareEntities,
    validTiprackIds,
    labwareRobotState: activeDeckSetupLabware,
  })

  const isSelectedTiprackValid =
    selectedTiprackId != null &&
    getIsTiprackSelectableAndValid({
      labware: activeDeckSetupLabware[selectedTiprackId],
      formTiprackUri,
      pipetteSpecs,
      nozzles,
      labwareEntities,
      validTiprackIds,
      labwareRobotState: activeDeckSetupLabware,
    })
  const isAnySelectedWellTooManyPickups = selectedTips.some(group => {
    const primaryWell = group[0]
    const selectedStatus = selectedTiprackStatus[primaryWell]
    return (
      selectedStatus != null &&
      !selectedStatus.isAccessible &&
      selectedStatus.inaccessibleReason === INACCESSIBLE_TOO_MANY_PICKUPS
    )
  })
  // Check physical tip state rather than the accessibility map for incompleteness. The map uses
  // tipsToIgnore as all selected wells, so every selected group's own wells appear as isComplete=false.
  // A group is actually incomplete only when a well is physically absent in the robot state.
  const isAnySelectedWellIncomplete =
    tipState != null &&
    selectedTips.some(group => {
      const primary = group[0]
      const affectedWells =
        selectedTiprackStatus[primary]?.affectedWells ?? group
      return affectedWells.some(w => tipState[w] === EMPTY)
    })

  const errorReason = ((): TipSelectionBannerReason | null => {
    if (isAnySelectedWellTooManyPickups) {
      return 'tooManyTips'
    }
    if (isAnySelectedWellIncomplete) {
      return 'incompletePickup'
    }
    if (selectedTips.length !== numPickups) {
      return 'pickupsRequired'
    }
    return null
  })()

  const handleContinue = (): void => {
    if (selectedTiprackId == null) {
      makeSnackbar(t('no_tiprack_selected') as string)
    } else if (currentStepIndex === NUM_TOTAL_STEPS - 1) {
      if (
        selectedTips.length !== numPickups ||
        isAnySelectedWellTooManyPickups ||
        isAnySelectedWellIncomplete
      ) {
        setShowErrorBanner(true)
      } else {
        handleSave()
      }
    } else {
      setCurrentStepIndex(prevStepIndex => prevStepIndex + 1)
    }
  }

  const handleGoBack = (): void => {
    setCurrentStepIndex(prevStepIndex => prevStepIndex - 1)
  }

  const handleClose = (): void => {
    setShowTipSelectionModal(false)
  }

  const baseProps: TipSelectionBaseProps = {
    selectedTiprackId,
    setSelectedTiprackId,
    formTiprackUri,
    activeDeckSetup,
    deckDef,
    pipetteSpecs,
    nozzles,
    pipetteId,
    primaryNozzle,
  }

  let currentComponent: JSX.Element
  switch (currentStepIndex) {
    case 0:
      currentComponent = <SelectTiprack {...baseProps} />
      break
    case 1:
      currentComponent = (
        <SelectTips
          {...baseProps}
          selectedTips={selectedTips}
          setSelectedTips={setSelectedTips}
          setShowErrorBanner={setShowErrorBanner}
          numTotalPickups={numPickups}
          nozzles={nozzles}
          tipAccessibilityStatus={tipAccessibilityStatus}
        />
      )
      break
    default:
      // protective, should not hit
      console.warn(`no current component for step index ${currentStepIndex}`)
      currentComponent = <></>
      break
  }

  return (
    <TipSelectionModal
      onClose={handleClose}
      onBack={handleGoBack}
      onContinue={handleContinue}
      showBackButton={currentStepIndex > 0}
      continueText={
        currentStepIndex === NUM_TOTAL_STEPS - 1
          ? t('select_tips')
          : t('continue')
      }
      currentStepIndex={currentStepIndex}
      totalSteps={NUM_TOTAL_STEPS}
      showErrorBanner={showErrorBanner}
      numPickupsRemaining={numPickups - selectedTips.length}
      showReusingTipsBanner={isAnySelectedWellUsed}
      showNoAvailableTipracksBanner={!areAnyMatchingTipracksSelectable}
      showSelectedTiprackNotValidBanner={!isSelectedTiprackValid}
      errorReason={errorReason}
    >
      {currentComponent}
    </TipSelectionModal>
  )
}
