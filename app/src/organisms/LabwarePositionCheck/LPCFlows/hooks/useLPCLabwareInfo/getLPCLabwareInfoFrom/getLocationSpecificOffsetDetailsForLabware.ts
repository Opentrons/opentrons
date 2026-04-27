import isEqual from 'lodash/isEqual'

import { ANY_LOCATION } from '@opentrons/api-client'

import { OFFSET_KIND_LOCATION_SPECIFIC } from '/app/redux/protocol-runs'

import type { LabwareOffsetLocationSequence } from '@opentrons/api-client'
import type { CompletedProtocolAnalysis } from '@opentrons/shared-data'
import type { LocationSpecificOffsetDetails } from '/app/redux/protocol-runs'
import type { GetLPCLabwareInfoForURI } from '.'

export function getLocationSpecificOffsetDetailsForLabware({
  currentOffsets,
  lwLocInfo,
  uri,
  protocolData,
}: GetLPCLabwareInfoForURI): LocationSpecificOffsetDetails[] {
  const hardCodedOffsetInfo = getHardCodedOffsetInfo(protocolData)

  return lwLocInfo
    .reduce<LocationSpecificOffsetDetails[]>((acc, comboInfo) => {
      const { definitionUri, lwOffsetLocSeq, ...restInfo } = comboInfo

      const existingOffset =
        currentOffsets?.find(
          offset =>
            uri === offset.definitionUri &&
            isEqual(offset.locationSequence, comboInfo.lwOffsetLocSeq)
        ) ?? null

      const hardCodedOffsetId =
        getHardCodedOffsetId(uri, lwOffsetLocSeq, hardCodedOffsetInfo) ?? null

      return lwOffsetLocSeq !== ANY_LOCATION
        ? [
            ...acc,
            {
              existingOffset: existingOffset ?? null,
              workingOffset: null,
              locationDetails: {
                ...restInfo,
                definitionUri,
                lwOffsetLocSeq,
                hardCodedOffsetId,
                kind: OFFSET_KIND_LOCATION_SPECIFIC,
              },
            },
          ]
        : acc
    }, [])
    .filter(detail => detail.locationDetails.definitionUri === uri)
}

type HardcodedOffsetIdAndOffsetLocSeq = [string, LabwareOffsetLocationSequence]

interface HardcodedOffsetInfo {
  [uri: string]: HardcodedOffsetIdAndOffsetLocSeq[]
}

// Returns hardcoded offset information for identifying other location-specific offsets.
// This behavior is predicated on API level 2.18+ set_offset() behavior, since modern LPC flows
// act on labware uris instead of specific labware instances.
function getHardCodedOffsetInfo(
  protocolData: CompletedProtocolAnalysis | null
): HardcodedOffsetInfo {
  const result: HardcodedOffsetInfo = {}

  if (protocolData == null) {
    return result
  }

  const { labwareOffsets } = protocolData
  labwareOffsets?.forEach(offset => {
    if (offset.locationSequence == null) {
      console.error(
        `Expected to find matching labware offset location sequence for labware: ${offset.definitionUri}`
      )
    } else {
      if (!(offset.definitionUri in result)) {
        result[offset.definitionUri] = []
      }

      result[offset.definitionUri].push([offset.id, offset.locationSequence])
    }
  })

  return result
}

// Given the labware uri and offset location sequence, returns the associated
// hardcoded offset id from hardcoded offset records, if any.
function getHardCodedOffsetId(
  uri: string,
  lwOffsetLocSeq: LabwareOffsetLocationSequence | typeof ANY_LOCATION,
  hardcodedInfo: HardcodedOffsetInfo
): string | undefined {
  if (uri in hardcodedInfo) {
    const matchingInfo = hardcodedInfo[uri].find(([_, locSeq]) =>
      isEqual(locSeq, lwOffsetLocSeq)
    )

    if (matchingInfo != null) {
      return matchingInfo[0]
    }
  }
}
