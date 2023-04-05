import * as React from 'react'
import { useTranslation } from 'react-i18next'

import { HostConfig, getRun, getCommands } from '@opentrons/api-client'
import { DEFAULT_PARAMS as DEFAULT_COMMANDS_PARAMS } from '@opentrons/react-api-client/src/runs/useAllCommandsQuery'
import { IconProps } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { ERROR_TOAST, INFO_TOAST } from '../../../atoms/Toast'
import { useToaster } from '../../../organisms/ToasterOven'
import { useProtocolDetailsForRun } from './useProtocolDetailsForRun'
import { downloadFile } from '../utils'

export function useDownloadRunLog(
  robotName: string,
  runId: string
): { downloadRunLog: () => void; isRunLogLoading: boolean } {
  const { t } = useTranslation('run_details')
  const host = useHost()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  const { makeToast } = useToaster()

  const { displayName } = useProtocolDetailsForRun(runId)
  const toastIcon: IconProps = { name: 'ot-spinner', spin: true }

  const downloadRunLog = (): void => {
    setIsLoading(true)
    makeToast(t('downloading_run_log'), INFO_TOAST, {
      icon: toastIcon,
    })

    getCommands(host as HostConfig, runId as string, DEFAULT_COMMANDS_PARAMS)
      .then(response => {
        const commands = response.data
        getRun(host as HostConfig, runId as string)
          .then(response => {
            const runRecord = response.data
            const runDetails = {
              ...runRecord,
              commands,
            }
            const protocolName = displayName ?? runRecord.data.protocolId ?? ''
            const createdAt = new Date(runRecord.data.createdAt).toISOString()
            const fileName = `${robotName}_${String(
              protocolName
            )}_${createdAt}.json`
            setIsLoading(false)
            downloadFile(runDetails, fileName)
          })
          .catch((e: Error) => {
            setIsLoading(false)
            makeToast(e.message, ERROR_TOAST)
          })
      })
      .catch((e: Error) => {
        setIsLoading(false)
        makeToast(e.message, ERROR_TOAST)
      })
  }

  return { downloadRunLog, isRunLogLoading: isLoading }
}
