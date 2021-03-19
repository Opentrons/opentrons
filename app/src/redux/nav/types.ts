// @flow

import type { IconName } from '@opentrons/components'

export type NavLocation = {|
  id: string,
  path: string,
  title: string,
  iconName: IconName,
  disabledReason?: string | null,
  notificationReason?: string | null,
  warningReason?: string | null,
|}

export type SubnavLocation = {|
  path: string,
  disabledReason?: string | null,
|}
