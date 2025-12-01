import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { getDeckDefFromRobotType } from '@opentrons/shared-data'
import { DIRTY, getDefaultPrimaryNozzle } from '@opentrons/step-generation'

import { useKitchen } from '/protocol-designer/components/organisms/Kitchen/useKitchen'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { getInvariantContext } from '/protocol-designer/step-forms/selectors'
import {
  getDeckSetupForActiveItem,
  getRobotStateAtActiveItem,
} from '/protocol-designer/top-selectors/labware-locations'

import { SelectTiprack } from './SelectTiprack'
import { SelectTips } from './SelectTips'
import { TipSelectionModal } from './TipSelectionModal'

import type { Dispatch, SetStateAction } from 'react'
import type { NozzleConfigurationStyle } from '@opentrons/shared-data'
import type { AccessibilityStatus, TipSelectionBaseProps } from './types'

const NUM_TOTAL_STEPS = 2

interface TipSelectionWizardProps {
  formTiprackUri: string
  setShowTipSelectionModal: Dispatch<SetStateAction<boolean>>
  pipetteId: string
  nozzles: NozzleConfigurationStyle
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
  } = props
  const { t } = useTranslation('tip_selection')
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [selectedTiprackId, setSelectedTiprackId] = useState<string | null>(
    tiprackSelected
  )
  const [showPickupsRequiredBanner, setShowPickupsRequiredBanner] =
    useState(false)
  const robotState = useSelector(getRobotStateAtActiveItem)
  const tipState =
    selectedTiprackId != null
      ? robotState?.tipState.tipracks[selectedTiprackId]
      : null
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const { pipetteEntities } = useSelector(getInvariantContext)
  const { spec: pipetteSpecs } = pipetteEntities[pipetteId]
  const robotType = useSelector(getRobotType)
  const { makeSnackbar } = useKitchen()

  const primaryNozzle = getDefaultPrimaryNozzle({
    nozzles,
    channels: pipetteSpecs.channels,
  })

  const deckDef = getDeckDefFromRobotType(robotType)

  const isAnySelectedWellUsed =
    tipState != null && selectedTips.flat().some(tip => tipState[tip] === DIRTY)
  const handleSave = (): void => {
    updateFormTiprackSelected(selectedTiprackId)
    updateFormTipsSelected(selectedTips)
    setShowTipSelectionModal(false)
  }

  const handleContinue = (): void => {
    if (selectedTiprackId == null) {
      makeSnackbar(t('no_tiprack_selected') as string)
    } else if (currentStepIndex === NUM_TOTAL_STEPS - 1) {
      if (selectedTips.length !== numPickups) {
        setShowPickupsRequiredBanner(true)
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
  }

  let currentComponent: JSX.Element
  switch (currentStepIndex) {
    case 0:
      currentComponent = (
        <SelectTiprack {...baseProps} validTiprackIds={validTiprackIds} />
      )
      break
    case 1:
      currentComponent = (
        <SelectTips
          {...baseProps}
          primaryNozzle={primaryNozzle}
          selectedTips={selectedTips}
          setSelectedTips={setSelectedTips}
          setShowPickupsRequiredBanner={setShowPickupsRequiredBanner}
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
      showPickupsRequiredBanner={showPickupsRequiredBanner}
      numPickupsRemaining={numPickups - selectedTips.length}
      showReusingTipsBanner={isAnySelectedWellUsed}
    >
      {currentComponent}
    </TipSelectionModal>
  )
}
