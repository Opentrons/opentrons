import { useTranslation } from 'react-i18next'

import { getStackerLocationFromSlotName } from '@opentrons/shared-data'

import { InterventionContent } from '/app/molecules/InterventionModal/InterventionContent'
import { RECOVERY_MAP } from '/app/organisms/ErrorRecoveryFlows/constants'

import type { ComponentProps, ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

type LeftColumnLabwareInfoProps = RecoveryContentProps & {
  title: string
  type: ComponentProps<typeof InterventionContent>['infoProps']['type']
  layout: ComponentProps<typeof InterventionContent>['infoProps']['layout']
  /* Renders a warning InlineNotification if provided. */
  bannerText?: string | null
  showQuantity?: boolean
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
  showQuantity = true,
}: LeftColumnLabwareInfoProps): ReactNode {
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
    STACKER_STALLED_RETRY,
    STACKER_STALLED_SKIP,
    STACKER_STALLED_STORE_SKIP,
    STACKER_STALLED_STORE_RETRY,
    STACKER_HOPPER_EMPTY_SKIP,
    STACKER_SHUTTLE_EMPTY_SKIP,
    STACKER_SHUTTLE_EMPTY_STORE_RETRY,
  } = RECOVERY_MAP
  const { t, i18n } = useTranslation(['error_recovery', 'shared'])

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
          deckLabel:
            relevantPickUpTipLwLocs.displayNameCurrentLoc.toUpperCase(),
        },
      }
    } else {
      switch (step) {
        case STACKER_STALLED_RETRY.STEPS.CHECK_HOPPER:
        case STACKER_STALLED_STORE_RETRY.STEPS.CHECK_HOPPER:
        case STACKER_STALLED_STORE_SKIP.STEPS.CHECK_HOPPER:
        case STACKER_STALLED_SKIP.STEPS.CHECK_HOPPER:
        case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.FILL_HOPPER:
          return {
            labwareName: failedLabwareNames.name ?? '',
            labwareNickname: failedLabwareNames.nickName,
            currentLocationProps: {
              deckLabel: getStackerLocationFromSlotName(
                failedLabwareLocations.displayNameNewLoc ??
                  displayNameCurrentLoc
              ),
            },
          }
        case STACKER_STALLED_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE:
        case STACKER_STALLED_STORE_RETRY.STEPS.PLACE_LABWARE_ON_SHUTTLE:
        case STACKER_HOPPER_EMPTY_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE:
        case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE:
        case STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.PLACE_LABWARE_ON_SHUTTLE:
          return {
            labwareName: failedLabwareNames.name ?? '',
            labwareNickname: failedLabwareNames.nickName,
            currentLocationProps: {
              deckLabel: i18n.format(
                t('shared:slot', {
                  slot: `${(displayNameNewLoc ?? '').slice(0, -1)}4`,
                }),
                'upperCase'
              ),
            },
          }
        default:
          return {
            labwareName: failedLabwareNames.name ?? '',
            labwareNickname: failedLabwareNames.nickName,
            currentLocationProps: {
              deckLabel:
                failedLabwareLocations.displayNameCurrentLoc.toUpperCase(),
            },
          }
      }
    }
  }

  const buildQuantity = (): number | null => {
    if (!showQuantity || labwareQuantity == null) {
      return null
    }
    // Define routes and steps that require quantity adjustment
    const requiresQuantityAdjustment = [
      {
        route: RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.ROUTE,
        step: RECOVERY_MAP.STACKER_HOPPER_EMPTY_SKIP.STEPS.FILL_HOPPER,
      },
      {
        route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.ROUTE,
        step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_SKIP.STEPS.FILL_HOPPER,
      },
      {
        route: RECOVERY_MAP.STACKER_STALLED_SKIP.ROUTE,
        step: RECOVERY_MAP.STACKER_STALLED_SKIP.STEPS.CHECK_HOPPER,
      },
      {
        route: RECOVERY_MAP.STACKER_STALLED_STORE_RETRY.ROUTE,
        step: RECOVERY_MAP.STACKER_STALLED_STORE_RETRY.STEPS.CHECK_HOPPER,
      },
      {
        route: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_RETRY.ROUTE,
        step: RECOVERY_MAP.STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.CHECK_HOPPER,
      },
    ]

    const needsAdjustment = requiresQuantityAdjustment.some(
      ({ route: expectedRoute, step: expectedStep }) =>
        route === expectedRoute && step === expectedStep
    )

    return needsAdjustment && labwareQuantity > 0
      ? labwareQuantity - 1 // one has been moved manually onto the shuttle
      : labwareQuantity
  }

  // build info props
  const quantity = buildQuantity()
  return (
    <InterventionContent
      headline={title}
      infoProps={{
        layout: layout,
        tagText: quantity ? t('quantity', { quantity }) : null,
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
