import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { IconProps } from '@opentrons/components'
import { useAllCommandsQuery, useRunQuery } from '@opentrons/react-api-client'

import { ERROR_TOAST, INFO_TOAST, useToast } from '../../../atoms/Toast'
import { useProtocolDetailsForRun } from './useProtocolDetailsForRun'
import { downloadFile } from '../utils'

export function useDownloadRunLog(
  robotName: string,
  runId: string,
  pageLength: number
): { downloadRunLog: () => void } {
  const { t } = useTranslation('run_details')

  const { makeToast, eatToast } = useToast()

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
    if (commands != null && run != null && isError) {
      makeToast(errorMessage, ERROR_TOAST)
    }
  }, [commands, errorMessage, isError, makeToast, run])

  const downloadRunLog = (): void => {
    if (commands != null && run != null) {
      const toastId = makeToast(t('downloading_run_log'), INFO_TOAST, {
        icon: toastIcon,
      })
      const runDetails = {
        ...run,
        commands,
      }
      const createdAt = new Date(run.createdAt).toISOString()
      const fileName = `${robotName}_${protocolName}_${createdAt}.json`
      downloadFile(runDetails, fileName)
      eatToast(toastId)
    }
  }

  return { downloadRunLog }
}
