import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { getDeckDefFromRobotType } from '@opentrons/shared-data'

import { useKitchen } from '/protocol-designer/components/organisms/Kitchen/useKitchen'
import { getRobotType } from '/protocol-designer/file-data/selectors'
import { getDeckSetupForActiveItem } from '/protocol-designer/top-selectors/labware-locations'

import { SelectTiprack } from './SelectTiprack'
import { SelectTips } from './SelectTips'
import { TipSelectionModal } from './TipSelectionModal'

import type { Dispatch, SetStateAction } from 'react'

const NUM_TOTAL_STEPS = 2
const STUBBED_NUM_PICKUPS = 10

interface TipSelectionWizardProps {
  formTiprackUri: string
  setShowTipSelectionModal: Dispatch<SetStateAction<boolean>>
  pipetteId: string
}

export function TipSelectionWizard(
  props: TipSelectionWizardProps
): JSX.Element {
  const { setShowTipSelectionModal, formTiprackUri, pipetteId } = props
  const { t } = useTranslation('tip_selection')
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0)
  const [selectedTiprackId, setSelectedTiprackId] = useState<string | null>(
    null
  )
  const [showPickupsRequiredBanner, setShowPickupsRequiredBanner] = useState(
    false
  )
  const [selectedTips, setSelectedTips] = useState<string[]>([])
  const activeDeckSetup = useSelector(getDeckSetupForActiveItem)
  const robotType = useSelector(getRobotType)
  const { makeSnackbar } = useKitchen()
  const deckDef = getDeckDefFromRobotType(robotType)

  const handleContinue = (): void => {
    if (selectedTiprackId == null) {
      makeSnackbar(t('no_tiprack_selected') as string)
    } else if (currentStepIndex === NUM_TOTAL_STEPS - 1) {
      if (selectedTips.length !== STUBBED_NUM_PICKUPS) {
        setShowPickupsRequiredBanner(true)
      } else {
        setShowTipSelectionModal(false)
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

  const baseProps = {
    selectedTiprackId,
    setSelectedTiprackId,
    formTiprackUri,
    activeDeckSetup,
    deckDef,
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
          setShowPickupsRequiredBanner={setShowPickupsRequiredBanner}
          numTotalPickups={STUBBED_NUM_PICKUPS}
          pipetteId={pipetteId}
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
      numPickupsRemaining={STUBBED_NUM_PICKUPS - selectedTips.length}
    >
      {currentComponent}
    </TipSelectionModal>
  )
}
