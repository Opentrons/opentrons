import { useState } from 'react'

import { ANY_LOCATION } from '@opentrons/api-client'
import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import {
  ANALYTICS_LPC_APPLY_OFFSETS,
  ANALYTICS_LPC_LAUNCH,
  ANALYTICS_LPC_OFFSET_SOURCE_RESOLUTION,
  ANALYTICS_LPC_SAVE_OFFSET,
  ANALYTICS_LPC_SAVE_OFFSET_TO_RUN_RECORD,
  useTrackEvent,
} from '/app/redux/analytics'

import type {
  LabwareOffsetCreateData,
  LegacyLabwareOffsetLocation,
  StoredLabwareOffset,
} from '@opentrons/api-client'
import type { LabwareOffsetLocationSequenceComponent } from '@opentrons/api-client/lib'
import type {
  AddressableAreaName,
  LocationSequenceComponent,
  ModuleModel,
  RobotType,
  Vector3D,
} from '@opentrons/shared-data'
import type { ResolvedOffsetSource } from '/app/redux/protocol-runs'

// A formatted location sequence digestible for LPC Mixpanel analysis
interface LPCLocationSequenceAnalytic {
  kind: LocationSequenceComponent['kind'] | 'anyLocation'
  info?: string | ModuleModel | AddressableAreaName
  child?: LPCLocationSequenceAnalytic
}

interface ReportSaveOffsetToRunRecordParams {
  uri: string
  locationDetails: LegacyLabwareOffsetLocation
  vector: Vector3D
  slot: string
}

export interface UseLPCAnalyticsProps {
  runId: string
  robotType: RobotType
}

export interface UseLPCAnalyticsResult {
  /* Report when a user launches LPC, generating a wizard session id. */
  reportLaunchLpcWizard: () => void
  /* Report when a user clicks the 'apply offsets' button. Effectively a Flex only event. */
  reportApplyOffsets: (data: LabwareOffsetCreateData[]) => void
  /* Report all the modified offsets when a user saves to the database. Flex only. */
  reportSaveOffset: (
    params: [StoredLabwareOffset[], StoredLabwareOffset[]]
  ) => void
  /* Report when an offset is `saved` to the run record. OT-2 only. */
  reportSaveOffsetToRunRecord: (
    params: ReportSaveOffsetToRunRecordParams
  ) => void
  /* Report the user-selected option whenever there is an offset source conflict. */
  reportOffsetSourceResolution: (resolvedSource: ResolvedOffsetSource) => void
}

export function useLPCAnalytics({
  runId,
  robotType,
}: UseLPCAnalyticsProps): UseLPCAnalyticsResult {
  const doTrackEvent = useTrackEvent()
  const [lpcWizardSessionId, setLpcWizardSessionId] = useState<string | null>(
    null
  )

  const reportLaunchLpcWizard = (): void => {
    const wizardSessionId = `${runId}-${Date.now()}`
    setLpcWizardSessionId(wizardSessionId)

    doTrackEvent({
      name: ANALYTICS_LPC_LAUNCH,
      properties: {
        robotType,
        runSession: runId,
        wizardSession: wizardSessionId,
      },
    })
  }

  // Offsets are applied outside the LPC wizard and therefore not tied to a wizard session.
  const reportApplyOffsets = (data: LabwareOffsetCreateData[]): void => {
    if (robotType === OT2_ROBOT_TYPE) {
      console.error('OT2 robot type should not report apply offsets.')
    } else {
      data.forEach(offset => {
        doTrackEvent({
          name: ANALYTICS_LPC_APPLY_OFFSETS,
          properties: {
            robotType,
            runSession: runId,
            offsetKind: getOffsetKindFrom(offset.locationSequence),
            slot: getSlotNameFrom(offset.locationSequence),
            uri: offset.definitionUri,
          },
        })
      })
    }
  }

  const reportSaveOffset = (
    params: [StoredLabwareOffset[], StoredLabwareOffset[]]
  ): void => {
    if (robotType === OT2_ROBOT_TYPE) {
      console.error(
        'OT-2 should not report save offset. Use reportSaveOffsetToRunRecord instead.'
      )
    } else {
      const sendSaveOffsetEvent = (offset: StoredLabwareOffset): void => {
        // Transform the locationSequence into a data structure digestible by Mixpanel.
        const locationDetails = ((): LPCLocationSequenceAnalytic | null => {
          if (offset.locationSequence === 'anyLocation') {
            return { kind: offset.locationSequence }
          } else {
            return offset.locationSequence.reduceRight((acc, lsComponent) => {
              const currentLevel: any = {
                kind: lsComponent.kind,
                info: null,
                child: null,
              }

              switch (lsComponent.kind) {
                case 'onLabware':
                  currentLevel.info = lsComponent.labwareUri
                  break
                case 'onModule':
                  currentLevel.info = lsComponent.moduleModel
                  break
                case 'onAddressableArea':
                  currentLevel.info = lsComponent.addressableAreaName
                  break
              }

              if (acc != null) {
                currentLevel.child = acc
              }

              return currentLevel
            }, null)
          }
        })()

        doTrackEvent({
          name: ANALYTICS_LPC_SAVE_OFFSET,
          properties: {
            robotType,
            runSession: runId,
            wizardSession: lpcWizardSessionId,
            uri: offset.definitionUri,
            locationDetails,
            slot: getSlotNameFrom(offset.locationSequence),
            vector: offset.vector,
            offsetKind: getOffsetKindFrom(offset.locationSequence),
          },
        })
      }
      const [updatedOffsets, deletedOffsets] = params

      updatedOffsets.forEach(sendSaveOffsetEvent)
      deletedOffsets.forEach(sendSaveOffsetEvent)
    }
  }

  const reportSaveOffsetToRunRecord = (
    params: ReportSaveOffsetToRunRecordParams
  ): void => {
    if (robotType === FLEX_ROBOT_TYPE) {
      console.error(
        'Flex should not report save offset to run record. Use reportSaveOffset instead.'
      )
    } else {
      doTrackEvent({
        name: ANALYTICS_LPC_SAVE_OFFSET_TO_RUN_RECORD,
        properties: {
          robotType,
          runSession: runId,
          wizardSession: lpcWizardSessionId,
          ...params,
        },
      })
    }
  }

  // Offset conflicts are resolved outside the LPC wizard and therefore not tied to a wizard session.
  const reportOffsetSourceResolution = (
    resolvedSource: ResolvedOffsetSource
  ): void => {
    if (robotType === OT2_ROBOT_TYPE) {
      console.error('OT-2 should not report offset source resolution.')
    } else {
      doTrackEvent({
        name: ANALYTICS_LPC_OFFSET_SOURCE_RESOLUTION,
        properties: {
          robotType,
          runSession: runId,
          resolvedSource,
        },
      })
    }
  }

  return {
    reportLaunchLpcWizard,
    reportApplyOffsets,
    reportSaveOffset,
    reportSaveOffsetToRunRecord,
    reportOffsetSourceResolution,
  }
}

function getSlotNameFrom(
  locationSequence:
    LabwareOffsetLocationSequenceComponent[] | typeof ANY_LOCATION
): string | null {
  const slot = locationSequence[locationSequence.length - 1]

  if (typeof slot === 'string') {
    return null
  } else if (slot.kind === 'onAddressableArea') {
    return slot.addressableAreaName
  }
  // The last location sequence component in a LabwareOffsetLocationSequence is
  // always the addressable area, but we handle unexpected input to be safe.
  else {
    return null
  }
}

function getOffsetKindFrom(
  locationSequence:
    LabwareOffsetLocationSequenceComponent[] | typeof ANY_LOCATION
): 'default' | 'appliedLocation' {
  return locationSequence === ANY_LOCATION ? 'default' : 'appliedLocation'
}
