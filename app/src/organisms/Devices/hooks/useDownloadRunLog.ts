import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  HostConfig,
  getRun,
  getCommands,
  getProtocol,
} from '@opentrons/api-client'
import { IconProps } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { ERROR_TOAST, INFO_TOAST } from '../../../atoms/Toast'
import { useToaster } from '../../../organisms/ToasterOven'
import { downloadFile } from '../utils'

export function useDownloadRunLog(
  robotName: string,
  runId: string
): { downloadRunLog: () => void; isRunLogLoading: boolean } {
  const { t } = useTranslation('run_details')
  const host = useHost()
  const [isLoading, setIsLoading] = React.useState<boolean>(false)

  const { makeToast } = useToaster()

  const toastIcon: IconProps = { name: 'ot-spinner', spin: true }

  const downloadRunLog = (): void => {
    setIsLoading(true)
    makeToast(t('downloading_run_log'), INFO_TOAST, {
      icon: toastIcon,
    })

    // first getCommands to get total length of commands
    getCommands(host as HostConfig, runId as string, {
      cursor: null,
      pageLength: 0,
    })
      .then(response => {
        const { totalLength } = response.data.meta
        getCommands(host as HostConfig, runId as string, {
          cursor: 0,
          pageLength: totalLength,
        })
          .then(response => {
            const commands = response.data
            getRun(host as HostConfig, runId as string)
              .then(response => {
                const runRecord = response.data
                const runDetails = {
                  ...runRecord,
                  commands,
                }
                const protocolId = response.data.data.protocolId ?? null
                const createdAt = new Date(
                  runRecord.data.createdAt
                ).toISOString()
                let fileName = `${robotName}_${
                  runRecord.data.protocolId ?? ''
                }_${createdAt}.json`

                if (protocolId != null) {
                  getProtocol(host as HostConfig, protocolId)
                    .then(response => {
                      const protocolName =
                        response.data.data.metadata.protocolName

                      fileName =
                        protocolName != null
                          ? `${robotName}_${String(
                              protocolName
                            )}_${createdAt}.json`
                          : fileName
                      setIsLoading(false)
                      downloadFile(runDetails, fileName)
                    })
                    .catch((e: Error) => {
                      setIsLoading(false)
                      makeToast(e.message, ERROR_TOAST)
                    })
                } else {
                  setIsLoading(false)
                  downloadFile(runDetails, fileName)
                }
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
      })
      .catch((e: Error) => {
        setIsLoading(false)
        makeToast(e.message, ERROR_TOAST)
      })
  }

  return { downloadRunLog, isRunLogLoading: isLoading }
}
