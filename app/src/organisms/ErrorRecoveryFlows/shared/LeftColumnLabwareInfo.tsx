import { InterventionContent } from '/app/molecules/InterventionModal/InterventionContent'
import { RECOVERY_MAP } from '/app/organisms/ErrorRecoveryFlows/constants'

import type { ComponentProps } from 'react'
import type { RecoveryContentProps } from '../types'

type LeftColumnLabwareInfoProps = RecoveryContentProps & {
  title: string
  type: ComponentProps<typeof InterventionContent>['infoProps']['type']
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
  recoveryMap,
}: LeftColumnLabwareInfoProps): JSX.Element {
  const { step, route } = recoveryMap
  const {
    failedLabwareNames,
    relevantPickUpTipLwNames,
    failedLabwareLocations,
    relevantPickUpTipLwLocs,
  } = failedLabwareUtils
  const { displayNameNewLoc } = failedLabwareLocations

  const buildNewLocation = (): ComponentProps<
    typeof InterventionContent
  >['infoProps']['newLocationProps'] =>
    displayNameNewLoc != null
      ? { deckLabel: displayNameNewLoc.toUpperCase() }
      : undefined

  const buildInfoNames = (): {
    labwareName: string
    labwareNickname: string
    currentLocationProps: { deckLabel: string }
  } => {
    if (
      route === RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.ROUTE &&
      (step ===
        RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.REPLACE_TIPS ||
        step === RECOVERY_MAP.MANUAL_FILL_AND_RETRY_NEW_TIPS.STEPS.SELECT_TIPS)
    ) {
      return {
        labwareName: relevantPickUpTipLwNames.name ?? '',
        labwareNickname: relevantPickUpTipLwNames.nickName ?? '',
        currentLocationProps: {
          deckLabel: relevantPickUpTipLwLocs.displayNameCurrentLoc.toUpperCase(),
        },
      }
    } else {
      return {
        labwareName: failedLabwareNames.name ?? '',
        labwareNickname: failedLabwareNames.nickName ?? '',
        currentLocationProps: {
          deckLabel: failedLabwareLocations.displayNameCurrentLoc.toUpperCase(),
        },
      }
    }
  }

  return (
    <InterventionContent
      headline={title}
      infoProps={{
        layout: 'default',
        type,
        newLocationProps: buildNewLocation(),
        ...buildInfoNames(),
      }}
      notificationProps={
        bannerText ? { type: 'alert', heading: bannerText } : undefined
      }
    />
  )
}
