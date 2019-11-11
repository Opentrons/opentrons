// @flow

export const GET: 'GET' = 'GET'
export const POST: 'POST' = 'POST'
export const PATCH: 'PATCH' = 'PATCH'
export const DELETE: 'DELETE' = 'DELETE'

export const PENDING: 'pending' = 'pending'
export const SUCCESS: 'success' = 'success'
export const FAILURE: 'failure' = 'failure'

// TODO(mc, 2019-11-12): deprecated, remove when able
export const ROBOT_API_ACTION_PREFIX = 'robotApi'
export const ROBOT_API_REQUEST_PREFIX = `${ROBOT_API_ACTION_PREFIX}:REQUEST`
export const ROBOT_API_RESPONSE_PREFIX = `${ROBOT_API_ACTION_PREFIX}:RESPONSE`
export const ROBOT_API_ERROR_PREFIX = `${ROBOT_API_ACTION_PREFIX}:ERROR`
