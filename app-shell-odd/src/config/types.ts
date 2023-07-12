import type { Config } from '@opentrons/app/src/redux/config/types'

export type { Config }

export interface Overrides {
  [field: string]: unknown | Overrides
}
