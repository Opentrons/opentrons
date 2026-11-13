import type { PipetteData } from '@opentrons/api-client'

export interface PipetteInformation extends PipetteData {
  displayName: string
}
