// @flow

import type { CustomLabwareAction, CheckedLabwareFile } from './types'

export const FETCH_CUSTOM_LABWARE: 'labware:FETCH_CUSTOM_LABWARE' =
  'labware:FETCH_CUSTOM_LABWARE'

export const CUSTOM_LABWARE: 'labware:CUSTOM_LABWARE' = 'labware:CUSTOM_LABWARE'

export const CHANGE_CUSTOM_LABWARE_DIRECTORY: 'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY' =
  'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY'

export const ADD_CUSTOM_LABWARE: 'labware:ADD_CUSTOM_LABWARE' =
  'labware:ADD_CUSTOM_LABWARE'

export const fetchCustomLabware = (): CustomLabwareAction => ({
  type: FETCH_CUSTOM_LABWARE,
  meta: { shell: true },
})

export const customLabware = (
  payload: Array<CheckedLabwareFile>
): CustomLabwareAction => ({ type: CUSTOM_LABWARE, payload })

export const changeCustomLabwareDirectory = (): CustomLabwareAction => ({
  type: CHANGE_CUSTOM_LABWARE_DIRECTORY,
  meta: { shell: true },
})

export const addCustomLabware = (): CustomLabwareAction => ({
  type: ADD_CUSTOM_LABWARE,
  meta: { shell: true },
})
