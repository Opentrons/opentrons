// @flow

import type { CustomLabwareAction, CheckedLabwareFile } from './types'

export const FETCH_CUSTOM_LABWARE: 'labware:FETCH_CUSTOM_LABWARE' =
  'labware:FETCH_CUSTOM_LABWARE'

export const CUSTOM_LABWARE: 'labware:CUSTOM_LABWARE' = 'labware:CUSTOM_LABWARE'

export const fetchCustomLabware = (): CustomLabwareAction => ({
  type: FETCH_CUSTOM_LABWARE,
  meta: { shell: true },
})

export const customLabware = (
  payload: Array<CheckedLabwareFile>
): CustomLabwareAction => ({ type: CUSTOM_LABWARE, payload })
