import { useMemo } from 'react'

import { useDataFileRawQuery } from '@opentrons/react-api-client'

import { MIME_TYPES } from '/app/resources/dataFiles/constants'

// Axios needs to know the `responseType` of the incoming data to parse it appropriately,
//  so we wrap the network hook with an expected `blob` type for images.
export function useImage(imageId: string): string | null {
  const { data, dataUpdatedAt } = useDataFileRawQuery(imageId, {}, 'blob')

  return useMemo(
    () => {
      if (data == null) {
        return null
      } else {
        const blob = new Blob([data], { type: MIME_TYPES.IMAGE })

        return URL.createObjectURL(blob)
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataUpdatedAt]
  )
}
