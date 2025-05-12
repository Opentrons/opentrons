import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useBlockingHint } from '../../components/organisms'
import { getWarningContent } from '../../pages/ProtocolOverview/UnusedModalContent'

interface ProtocolExportHandlerProps {
  noCommands: any
  modulesWithoutStep: any
  pipettesWithoutStep: any
  gripperWithoutStep: any
  fixtureWithoutStep: any
  onConfirmExport: () => void
}

interface ProtocolExportHandlerResult {
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
}: ProtocolExportHandlerProps): ProtocolExportHandlerResult => {
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
