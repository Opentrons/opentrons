// @flow

import type { Config } from '@opentrons/app/src/config/types'

export type { Config }

export type Overrides = { [string]: mixed | Overrides, ... }
