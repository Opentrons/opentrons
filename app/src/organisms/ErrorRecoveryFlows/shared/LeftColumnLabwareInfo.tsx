import { InterventionContent } from '/app/molecules/InterventionModal/InterventionContent'

import type * as React from 'react'
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
    failedLabwareNickname,
    failedLabwareLocations,
  } = failedLabwareUtils
  const { newLoc, currentLoc } = failedLabwareLocations

  const buildNewLocation = (): React.ComponentProps<
    typeof InterventionContent
  >['infoProps']['newLocationProps'] =>
    newLoc != null ? { deckLabel: newLoc } : undefined

  return (
    <InterventionContent
      headline={title}
      infoProps={{
        type,
        labwareName: failedLabwareName ?? '',
        labwareNickname: failedLabwareNickname ?? '',
        currentLocationProps: { deckLabel: currentLoc },
        newLocationProps: buildNewLocation(),
      }}
      notificationProps={
        bannerText ? { type: 'alert', heading: bannerText } : undefined
      }
    />
  )
}
