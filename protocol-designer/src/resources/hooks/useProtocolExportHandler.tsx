import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useBlockingHint } from '../../components/organisms'
import { getWarningContent } from '../../pages/ProtocolOverview/UnusedModalContent'

import type { Fixture } from '../../pages/ProtocolOverview'
import type { ModuleOnDeck, PipetteOnDeck } from '../../step-forms'

export interface USeProtocolExportHandlerProps {
  noCommands: boolean
  modulesWithoutStep: ModuleOnDeck[]
  pipettesWithoutStep: PipetteOnDeck[]
  gripperWithoutStep: boolean
  fixtureWithoutStep: Fixture
  onConfirmExport: () => void
}

interface UseProtocolExportHandlerResult {
  handleExportClick: () => void
  exportWarningModalElement: JSX.Element | null
}

export const useProtocolExportHandler = ({
  noCommands,
  modulesWithoutStep,
  pipettesWithoutStep,
  gripperWithoutStep,
  fixtureWithoutStep,
  onConfirmExport,
}: USeProtocolExportHandlerProps): UseProtocolExportHandlerResult => {
  const { t } = useTranslation(['protocol_overview', 'alert'])
  const [showModalWithWarning, setShowModalWithWarning] = useState<boolean>(
    false
  )

  const hasWarning =
    noCommands ||
    modulesWithoutStep.length > 0 ||
    pipettesWithoutStep.length > 0 ||
    gripperWithoutStep ||
    fixtureWithoutStep.trashBin ||
    fixtureWithoutStep.wasteChute ||
    fixtureWithoutStep.stagingAreaSlots.length > 0

  const warningDetails = hasWarning
    ? getWarningContent({
        noCommands,
        pipettesWithoutStep,
        modulesWithoutStep,
        gripperWithoutStep,
        fixtureWithoutStep,
        t,
      })
    : null

  const proceedExport = useCallback(() => {
    setShowModalWithWarning(false)
    onConfirmExport()
  }, [onConfirmExport])

  const cancelExportWarning = useCallback(() => {
    setShowModalWithWarning(false)
  }, [])

  const exportWarningModalElement = useBlockingHint({
    hintKey: warningDetails?.hintKey ?? null,
    enabled: showModalWithWarning,
    content: warningDetails?.content,
    handleCancel: cancelExportWarning,
    handleContinue: proceedExport,
  })

  const handleExportClick = useCallback(() => {
    if (hasWarning) {
      setShowModalWithWarning(true)
    } else {
      onConfirmExport()
    }
  }, [hasWarning, onConfirmExport])

  return {
    handleExportClick,
    exportWarningModalElement,
  }
}
