// @flow

// driver statuses

export const NOT_APPLICABLE: 'NOT_APPLICABLE' = 'NOT_APPLICABLE'
export const UNKNOWN: 'UNKNOWN' = 'UNKNOWN'
export const UP_TO_DATE: 'UP_TO_DATE' = 'UP_TO_DATE'
export const OUTDATED: 'OUTDATED' = 'OUTDATED'

// action types

export const INITIALIZED: 'systemInfo:INITIALIZED' = 'systemInfo:INITIALIZED'

export const USB_DEVICE_ADDED: 'systemInfo:USB_DEVICE_ADDED' =
  'systemInfo:USB_DEVICE_ADDED'

export const USB_DEVICE_REMOVED: 'systemInfo:USB_DEVICE_REMOVED' =
  'systemInfo:USB_DEVICE_REMOVED'
