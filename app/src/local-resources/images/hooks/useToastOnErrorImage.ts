import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import head from 'lodash/head'

import { INFO_TOAST } from '@opentrons/components'
import { useCommandQuery } from '@opentrons/react-api-client'

// eslint-disable-next-line opentrons/no-imports-across-applications
import { useToaster } from '/app/organisms/ToasterOven'
import { useNotifyImageFileQuery } from '/app/resources/dataFiles/useNotifyImageFileQuery'

const IMAGE_METADATA_POLL_MS = 5000
const TOAST_DURATION_MS = 4000

// Generates a toast whenever a new image involving an error is captured.
export function useToastOnErrorImage(runId: string): void {
  const { t } = useTranslation('run_details')
  const { makeToast } = useToaster()

  const { data } = useNotifyImageFileQuery(runId, {
    refetchInterval: IMAGE_METADATA_POLL_MS,
  })

  const mostRecentImg = head(data?.data) ?? null
  const { data: cmdDetails } = useCommandQuery(
    runId,
    mostRecentImg?.commandId ?? null
  )

  useEffect(() => {
    if (mostRecentImg != null && cmdDetails?.data.error != null) {
      makeToast(t('image_in_gallery') as string, INFO_TOAST, {
        duration: TOAST_DURATION_MS,
        closeButton: true,
        heading: t('image_during_error'),
      })
    }
  }, [cmdDetails?.data.id])
}
