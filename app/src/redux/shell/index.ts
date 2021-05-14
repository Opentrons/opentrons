// desktop shell module

export * from './actions'
export * from './update'
export * from './robot-logs/actions'
export * from './robot-logs/selectors'

export const CURRENT_VERSION: string = process.env.OT_APP_VERSION as string
