// @flow

import * as Types from './types'

// action type literals

export const FETCH_CUSTOM_LABWARE: 'labware:FETCH_CUSTOM_LABWARE' =
  'labware:FETCH_CUSTOM_LABWARE'

export const CUSTOM_LABWARE_LIST: 'labware:CUSTOM_LABWARE_LIST' =
  'labware:CUSTOM_LABWARE_LIST'

export const CUSTOM_LABWARE_LIST_FAILURE: 'labware:CUSTOM_LABWARE_LIST_FAILURE' =
  'labware:CUSTOM_LABWARE_LIST_FAILURE'

export const CHANGE_CUSTOM_LABWARE_DIRECTORY: 'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY' =
  'labware:CHANGE_CUSTOM_LABWARE_DIRECTORY'

export const ADD_CUSTOM_LABWARE: 'labware:ADD_CUSTOM_LABWARE' =
  'labware:ADD_CUSTOM_LABWARE'

export const ADD_CUSTOM_LABWARE_FAILURE: 'labware:ADD_CUSTOM_LABWARE_FAILURE' =
  'labware:ADD_CUSTOM_LABWARE_FAILURE'

export const CLEAR_ADD_CUSTOM_LABWARE_FAILURE: 'labware:CLEAR_ADD_CUSTOM_LABWARE_FAILURE' =
  'labware:CLEAR_ADD_CUSTOM_LABWARE_FAILURE'

// action creators

export const fetchCustomLabware = (): Types.FetchCustomLabwareAction => ({
  type: FETCH_CUSTOM_LABWARE,
  meta: { shell: true },
})

export const customLabwareList = (
  payload: Array<Types.CheckedLabwareFile>
): Types.CustomLabwareListAction => ({ type: CUSTOM_LABWARE_LIST, payload })

export const customLabwareListFailure = (
  message: string
): Types.CustomLabwareListFailureAction => ({
  type: CUSTOM_LABWARE_LIST_FAILURE,
  payload: { message },
})

export const changeCustomLabwareDirectory = (): Types.ChangeCustomLabwareDirectoryAction => ({
  type: CHANGE_CUSTOM_LABWARE_DIRECTORY,
  meta: { shell: true },
})

export const addCustomLabware = (
  overwrite: Types.DuplicateLabwareFile | null = null
): Types.AddCustomLabwareAction => ({
  type: ADD_CUSTOM_LABWARE,
  payload: { overwrite },
  meta: { shell: true },
})

export const addCustomLabwareFailure = (
  labware: Types.FailedLabwareFile | null = null,
  message: string | null = null
): Types.AddCustomLabwareFailureAction => ({
  type: ADD_CUSTOM_LABWARE_FAILURE,
  payload: { labware, message },
})

export const clearAddCustomLabwareFailure = (): Types.ClearAddCustomLabwareFailureAction => ({
  type: CLEAR_ADD_CUSTOM_LABWARE_FAILURE,
})
