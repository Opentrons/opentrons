// @flow
// desktop shell module

import { remote } from './remote'

const { CURRENT_VERSION, CURRENT_RELEASE_NOTES } = remote

export * from './actions'
export * from './update'
export * from './robot-logs/actions'
export * from './robot-logs/selectors'

export { CURRENT_VERSION, CURRENT_RELEASE_NOTES }
