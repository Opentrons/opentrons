import { useDataFileRawQuery } from '@opentrons/react-api-client'

export function useImage(imageId: string = 'stubId'): string | null {
  useDataFileRawQuery(imageId)
  const imagePath = null
  return imagePath
}
