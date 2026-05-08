// desktop shell module

export * from './actions'
export * from './selectors'
export * from './update'
export * from './is-ready/actions'
export * from './is-ready/selectors'
export * from './types'

export const CURRENT_VERSION: string = _PKG_VERSION_
export const GIT_COMMIT_HASH: string = _GIT_COMMIT_HASH_
