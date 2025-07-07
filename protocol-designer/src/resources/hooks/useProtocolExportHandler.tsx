import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { StyledText } from '@opentrons/components'

import { useBlockingHint } from '../../components/organisms'

export interface UseProtocolExportHandlerProps {
  hasCommands: boolean
  onConfirmExport: () => void
}

interface UseProtocolExportHandlerResult {
  handleExportClick: () => void
  exportWarningModalElement: JSX.Element | null
}

export const useProtocolExportHandler = ({
  hasCommands,
  onConfirmExport,
}: UseProtocolExportHandlerProps): UseProtocolExportHandlerResult => {
  const { t } = useTranslation(['protocol_overview', 'alert'])
  const [showModalWithWarning, setShowModalWithWarning] = useState<boolean>(
    false
  )

  const hasWarning = !hasCommands

  const content = (
    <StyledText desktopStyle="bodyDefaultRegular">
      {t('alert:export_warnings.redesign.no_commands.body1')}
    </StyledText>
  )

  const proceedExport = useCallback(() => {
    setShowModalWithWarning(false)
    onConfirmExport()
  }, [onConfirmExport])

  const cancelExportWarning = useCallback(() => {
    setShowModalWithWarning(false)
  }, [])

  const exportWarningModalElement = useBlockingHint({
    hintKey: 'no_commands',
    enabled: showModalWithWarning,
    content: content,
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
