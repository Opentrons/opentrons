// @flow

import type { Config } from '../config/types'

export type SupportConfig = $PropertyType<Config, 'support'>

export type SupportProfileUpdate = $Shape<{|
  [propertyName: string]: string | number | boolean | null,
|}>
