// TODO(mc, 2018-08-08): figure out type exports from app
import type {
  Action,
  Error as PlainError,
} from '@opentrons/app/src/redux/types'
import type { Logger } from '@opentrons/app/src/logger'
export type { Action, PlainError }

export type Dispatch = (action: Action) => void

export type { Logger }

export interface Manifest {
  production: {
    [version: string]: {
      fullImage: [url: string]
      system: [url: string]
      version: [url: string]
      releaseNotes: [url: string]
    }
  }
}
