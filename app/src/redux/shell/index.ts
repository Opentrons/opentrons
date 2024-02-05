// desktop shell module

export * from './actions'
export * from './update'
export * from './is-ready/actions'
export * from './is-ready/selectors'

export const CURRENT_VERSION: string = (global as any)._PKG_VERSION_
