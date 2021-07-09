import * as allSharedData from '@opentrons/shared-data'

declare global {
  interface Window {
    sharedData: typeof allSharedData
  }
}
