// @flow

// TODO(mc, 2018-08-08): figure out type exports from app
import type { Action, Error as PlainError } from '@opentrons/app/src/types'

export type { Action, PlainError }

export type Dispatch = Action => void
