import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { IconProps } from '@opentrons/components'
import { useAllCommandsQuery, useRunQuery } from '@opentrons/react-api-client'

import { Toast } from '../../atoms/Toast'
import { useProtocolDetailsForRun } from './hooks'
import { downloadFile } from './utils'

interface DownloadRunLogToastProps {
  robotName: string
  runId: string
  onClose: () => void
  pageLength: number
}

export function DownloadRunLogToast({
  robotName,
  runId,
  pageLength,
  onClose,
}: DownloadRunLogToastProps): JSX.Element {
  const { t } = useTranslation('run_details')

  const {
    data: allCommandsQueryData,
    error: allCommandsQueryError,
    isError: isAllCommandsQueryError,
  } = useAllCommandsQuery(
    runId,
    {
      cursor: 0,
      pageLength,
    },
    { staleTime: Infinity }
  )
  const commands = allCommandsQueryData?.data

  const {
    data: runQueryData,
    error: runQueryError,
    isError: isRunQueryError,
  } = useRunQuery(runId, { staleTime: Infinity })
  const run = runQueryData?.data

  const isError = isAllCommandsQueryError || isRunQueryError
  // prioritize display of commands error
  const errorMessage =
    allCommandsQueryError?.message ?? runQueryError?.message ?? ''

  const { displayName } = useProtocolDetailsForRun(runId)
  const protocolName = displayName ?? run?.protocolId ?? ''

  const toastIcon: IconProps = { name: 'ot-spinner', spin: true }

  React.useEffect(() => {
    if (commands != null && run != null) {
      const runDetails = {
        ...run,
        commands,
      }
      const createdAt = new Date(run.createdAt).toISOString()
      const fileName = `${robotName}_${protocolName}_${createdAt}.json`
      downloadFile(runDetails, fileName)
      onClose()
    }
  }, [commands, protocolName, robotName, run, onClose])

  return (
    <Toast
      message={isError ? errorMessage : t('downloading_run_log')}
      type={isError ? 'error' : 'info'}
      icon={isError ? undefined : toastIcon}
      closeButton={isError}
      onClose={onClose}
      disableTimeout={true}
    />
  )
}
