import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getCommands, getProtocol, getRun } from '@opentrons/api-client'
import { ERROR_TOAST, INFO_TOAST } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { isFileSaveCanceledError } from '/app/local-resources/files/fileSaveCanceledError'
import { useToaster } from '/app/organisms/ToasterOven'
import { saveFileFromBuffer } from '/app/redux/shell/remote'

import type { IconProps } from '@opentrons/components'

export function useDownloadRunLog(
  robotName: string,
  runId: string
): { downloadRunLog: () => void; isRunLogLoading: boolean } {
  const { t } = useTranslation('run_details')
  const host = useHost()
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const { makeToast } = useToaster()

  const toastIcon: IconProps = { name: 'ot-spinner', spin: true }

  const saveRunLog = (runDetails: object, fileName: string): void => {
    void saveFileFromBuffer({
      name: fileName,
      buffer: new TextEncoder().encode(JSON.stringify(runDetails)).buffer,
    })
      .catch((error: unknown) => {
        if (!isFileSaveCanceledError(error)) {
          throw error
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const downloadRunLog = (): void => {
    setIsLoading(true)
    makeToast(t('downloading_run_log') as string, INFO_TOAST, {
      icon: toastIcon,
    })
    if (host == null) return
    // first getCommands to get total length of commands
    getCommands(host, runId, {
      pageLength: 0,
      includeFixitCommands: true,
    })
      .then(response => {
        const { totalLength } = response.data.meta
        getCommands(host, runId, {
          cursor: 0,
          pageLength: totalLength,
          includeFixitCommands: true,
        })
          .then(response => {
            const commands = response.data
            getRun(host, runId)
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
                  getProtocol(host, protocolId)
                    .then(response => {
                      const protocolName =
                        response.data.data.metadata.protocolName

                      fileName =
                        protocolName != null
                          ? `${robotName}_${String(
                              protocolName
                            )}_${createdAt}.json`
                          : fileName
                      saveRunLog(runDetails, fileName)
                    })
                    .catch((e: Error) => {
                      setIsLoading(false)
                      makeToast(e.message, ERROR_TOAST)
                    })
                } else {
                  saveRunLog(runDetails, fileName)
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
