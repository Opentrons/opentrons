// @flow
// desktop shell module

import pkg from '../../package.json'

export * from './actions'
export * from './update'
export * from './robot-logs/actions'
export * from './robot-logs/selectors'

export const CURRENT_VERSION: string = pkg.version
