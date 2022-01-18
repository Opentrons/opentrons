import type { IconName } from '@opentrons/components'

export interface NavLocation {
  id: string
  path: string
  title: string
  iconName: IconName
  disabledReason?: string | null
  notificationReason?: string | null
  warningReason?: string | null
}
