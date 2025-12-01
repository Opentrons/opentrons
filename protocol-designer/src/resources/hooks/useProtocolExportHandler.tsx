import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'

import { StyledText } from '@opentrons/components'

import { getRobotStateTimeline } from '/protocol-designer/file-data/selectors'
import { getArgsAndErrorsByStepId } from '/protocol-designer/step-forms/selectors'

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
  const [showModalWithWarning, setShowModalWithWarning] =
    useState<boolean>(false)
  const argsAndErrorsByStepId = useSelector(getArgsAndErrorsByStepId)
  const timeline = useSelector(getRobotStateTimeline)
  const hasFormErrors = Object.values(argsAndErrorsByStepId).some(
    step => step.errors
  )
  const hasTimelineErrors = timeline?.errors != null

  const hasWarning = !hasCommands || hasFormErrors || hasTimelineErrors

  const content = (
    <StyledText desktopStyle="bodyDefaultRegular">
      {hasTimelineErrors || hasFormErrors
        ? t('alert:hint.has_errors.body1')
        : t('alert:export_warnings.redesign.no_commands.body1')}
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
    hintKey: hasFormErrors || hasTimelineErrors ? 'has_errors' : 'no_commands',
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
