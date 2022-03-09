// custom labware selectors
import { basename } from 'path'
import { createSelector } from 'reselect'
import sortBy from 'lodash/sortBy'

import { getConfig } from '../config'
import { getIsTiprack } from '@opentrons/shared-data'

import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { State } from '../types'
import type {
  CheckedLabwareFile,
  ValidLabwareFile,
  FailedLabwareFile,
} from './types'

export const INVALID_LABWARE_FILE: 'INVALID_LABWARE_FILE' =
  'INVALID_LABWARE_FILE'

export const DUPLICATE_LABWARE_FILE: 'DUPLICATE_LABWARE_FILE' =
  'DUPLICATE_LABWARE_FILE'

export const OPENTRONS_LABWARE_FILE: 'OPENTRONS_LABWARE_FILE' =
  'OPENTRONS_LABWARE_FILE'

export const VALID_LABWARE_FILE: 'VALID_LABWARE_FILE' = 'VALID_LABWARE_FILE'
