import { useTranslation } from 'react-i18next'

import { IconProps } from '@opentrons/components'
import { useAllCommandsQuery, useRunQuery } from '@opentrons/react-api-client'

import { ERROR_TOAST, INFO_TOAST, useToast } from '../../../atoms/Toast'
import { useProtocolDetailsForRun } from './useProtocolDetailsForRun'
import { downloadFile } from '../utils'

// TODO(bh, 2022-12-5): consider refactoring -
// currently, this hook makes run and commands queries for each historical run on device details page load
// this is not ideal for performance, and doesn't allow for a toast that responds to "download" status
export function useDownloadRunLog(
  robotName: string,
  runId: string,
  pageLength: number
): { downloadRunLog: () => void; isRunLogLoading: boolean } {
  const { t } = useTranslation('run_details')

  const { makeToast } = useToast()

  const {
    data: allCommandsQueryData,
    error: allCommandsQueryError,
    isError: isAllCommandsQueryError,
    isLoading: isCommandsQueryLoading,
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
    isLoading: isRunQueryLoading,
  } = useRunQuery(runId, { staleTime: Infinity })
  const run = runQueryData?.data

  const isError = isAllCommandsQueryError || isRunQueryError

  // a loading boolean to indicate when downloadRunLog is available
  const isRunLogLoading = isCommandsQueryLoading || isRunQueryLoading

  // prioritize display of commands error
  const errorMessage =
    allCommandsQueryError?.message ?? runQueryError?.message ?? ''

  const { displayName } = useProtocolDetailsForRun(runId)
  const protocolName = displayName ?? run?.protocolId ?? ''

  const toastIcon: IconProps = { name: 'ot-spinner', spin: true }

  const downloadRunLog = (): void => {
    if (isError) {
      makeToast(errorMessage, ERROR_TOAST)
    } else if (commands != null && run != null) {
      makeToast(t('downloading_run_log'), INFO_TOAST, {
        icon: toastIcon,
      })
      const runDetails = {
        ...run,
        commands,
      }
      const createdAt = new Date(run.createdAt).toISOString()
      const fileName = `${robotName}_${protocolName}_${createdAt}.json`
      downloadFile(runDetails, fileName)
    }
  }

  return { downloadRunLog, isRunLogLoading }
}
