import { useTranslation } from 'react-i18next'

import { InterventionContent } from '/app/molecules/InterventionModal/InterventionContent'
import { RECOVERY_MAP } from '/app/organisms/ErrorRecoveryFlows/constants'

import type { ComponentProps } from 'react'
import type { RecoveryContentProps } from '../types'

type LeftColumnLabwareInfoProps = RecoveryContentProps & {
  title: string
  type: ComponentProps<typeof InterventionContent>['infoProps']['type']
  layout: ComponentProps<typeof InterventionContent>['infoProps']['layout']
  /* Renders a warning InlineNotification if provided. */
  bannerText?: string | null
}
// TODO(jh, 06-12-24): EXEC-500 & EXEC-501.
// The left column component adjacent to RecoveryDeckMap/TipSelection.
export function LeftColumnLabwareInfo({
  title,
  failedLabwareUtils,
  type,
  layout,
  bannerText,
  recoveryMap,
}: LeftColumnLabwareInfoProps): JSX.Element {
  const { step, route } = recoveryMap
  const {
    failedLabwareNames,
    relevantPickUpTipLwNames,
    failedLabwareLocations,
    relevantPickUpTipLwLocs,
    labwareQuantity,
  } = failedLabwareUtils
  const { displayNameNewLoc, displayNameCurrentLoc } = failedLabwareLocations
  const {
    MANUAL_REPLACE_STACKER_AND_RETRY,
    MANUAL_LOAD_IN_STACKER_AND_SKIP,
    HOPPER_MANUAL_LOAD_ON_SHUTTLE_AND_SKIP,
    MANUAL_LOAD_ON_SHUTTLE_AND_SKIP,
  } = RECOVERY_MAP
  const { t } = useTranslation('error_recovery')

  const buildNewLocation = (): ComponentProps<
    typeof InterventionContent
  >['infoProps']['newLocationProps'] =>
    displayNameNewLoc != null
      ? { deckLabel: displayNameNewLoc.toUpperCase() }
      : undefined

  const buildInfoNames = (): {
    labwareName: string
    labwareNickname: string | undefined
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
        labwareNickname: relevantPickUpTipLwNames.nickName,
        currentLocationProps: {
          deckLabel: relevantPickUpTipLwLocs.displayNameCurrentLoc.toUpperCase(),
        },
      }
    } else {
      switch (step) {
        case MANUAL_REPLACE_STACKER_AND_RETRY.STEPS.CONFIRM_RETRY:
        case MANUAL_LOAD_IN_STACKER_AND_SKIP.STEPS.CONFIRM_RETRY:
          return {
            labwareName: failedLabwareNames.name ?? '',
            labwareNickname: failedLabwareNames.nickName,
            currentLocationProps: {
              deckLabel: displayNameCurrentLoc.toUpperCase(),
            },
          }
        case MANUAL_LOAD_IN_STACKER_AND_SKIP.STEPS.MANUAL_REPLACE:
        case HOPPER_MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.HOPPER_MANUAL_REPLACE:
        case MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.CONFIRM_RETRY:
          return {
            labwareName: failedLabwareNames.name ?? '',
            labwareNickname: failedLabwareNames.nickName,
            currentLocationProps: {
              deckLabel: displayNameNewLoc?.toUpperCase() ?? '',
            },
          }
        default:
          return {
            labwareName: failedLabwareNames.name ?? '',
            labwareNickname: failedLabwareNames.nickName,
            currentLocationProps: {
              deckLabel: failedLabwareLocations.displayNameCurrentLoc.toUpperCase(),
            },
          }
      }
    }
  }

  const buildQuantity = (): number | null => {
    switch (step) {
      case MANUAL_REPLACE_STACKER_AND_RETRY.STEPS.CONFIRM_RETRY:
      case MANUAL_LOAD_IN_STACKER_AND_SKIP.STEPS.CONFIRM_RETRY:
      case HOPPER_MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.CONFIRM_RETRY:
        return labwareQuantity
      case MANUAL_LOAD_IN_STACKER_AND_SKIP.STEPS.MANUAL_REPLACE:
      case HOPPER_MANUAL_LOAD_ON_SHUTTLE_AND_SKIP.STEPS.HOPPER_MANUAL_REPLACE:
        return null
      default:
        return labwareQuantity
    }
  }

  // build info props
  return (
    <InterventionContent
      headline={title}
      infoProps={{
        layout: layout,
        tagText: buildQuantity()
          ? t('quantity', { quantity: buildQuantity() })
          : null,
        subText: undefined, // TODO (tz, 5-1-2025): get lid name
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
