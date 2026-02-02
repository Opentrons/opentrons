import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'

import { fileUploadMessage, loadProtocolFileFromFile } from './actions'
import {
  assertAllowedImportUrl,
  getImportProtocolQueryParams,
  loadFileFromSignedUrl,
  stripImportProtocolQueryParams,
} from './importFromUrl'

import type { ThunkDispatch } from '/protocol-designer/types'

export function useImportProtocolFromUrl(): void {
  const dispatch: ThunkDispatch<any> = useDispatch()
  const navigate = useNavigate()
  const didRunRef = useRef(false)

  useEffect(() => {
    if (didRunRef.current) return
    didRunRef.current = true

    const queryParams = getImportProtocolQueryParams()
    if (queryParams == null) return

    const run = async (): Promise<void> => {
      try {
        assertAllowedImportUrl(queryParams.signedUrl)

        const file = await loadFileFromSignedUrl(queryParams)
        dispatch(loadProtocolFileFromFile(file))

        // Prevent repeated imports on refresh.
        stripImportProtocolQueryParams()

        navigate('/overview')
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e)
        dispatch(
          fileUploadMessage({
            isError: true,
            errorType: 'FAILED_TO_IMPORT_FROM_URL',
            errorMessage: message,
          })
        )
      }
    }

    void run()
  }, [dispatch, navigate])
}
