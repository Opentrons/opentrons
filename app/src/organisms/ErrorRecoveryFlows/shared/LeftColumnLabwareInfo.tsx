import type * as React from 'react'

import { InterventionContent } from '/app/molecules/InterventionModal/InterventionContent'

import type { RecoveryContentProps } from '../types'

type LeftColumnLabwareInfoProps = RecoveryContentProps & {
  title: string
  type: React.ComponentProps<typeof InterventionContent>['infoProps']['type']
  /* Renders a warning InlineNotification if provided. */
  bannerText?: string
}
// TODO(jh, 06-12-24): EXEC-500 & EXEC-501.
// The left column component adjacent to RecoveryDeckMap/TipSelection.
export function LeftColumnLabwareInfo({
  title,
  failedLabwareUtils,
  type,
  bannerText,
}: LeftColumnLabwareInfoProps): JSX.Element | null {
  const {
    failedLabwareName,
    failedLabware,
    failedLabwareNickname,
  } = failedLabwareUtils

  const buildLabwareLocationSlotName = (): string => {
    const location = failedLabware?.location
    if (
      location != null &&
      typeof location === 'object' &&
      'slotName' in location
    ) {
      return location.slotName
    } else {
      return ''
    }
  }

  return (
    <InterventionContent
      headline={title}
      infoProps={{
        type,
        labwareName: failedLabwareName ?? '',
        labwareNickname: failedLabwareNickname ?? '',
        currentLocationProps: { deckLabel: buildLabwareLocationSlotName() },
      }}
      notificationProps={
        bannerText ? { type: 'alert', heading: bannerText } : undefined
      }
    />
  )
}
