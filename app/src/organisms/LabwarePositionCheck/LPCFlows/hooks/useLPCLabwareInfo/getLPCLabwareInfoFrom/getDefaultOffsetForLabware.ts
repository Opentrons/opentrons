import { ANY_LOCATION } from '@opentrons/api-client'
import {
  C2_ADDRESSABLE_AREA,
  C3_ADDRESSABLE_AREA,
  getLabwareDefURI,
} from '@opentrons/shared-data'

import { OFFSET_KIND_DEFAULT } from '/app/redux/protocol-runs'

import type {
  DefaultOffsetDetails,
  LabwareLocationInfo,
  LabwareModuleStackupDetails,
  LocationSpecificOffsetDetails,
} from '/app/redux/protocol-runs'
import type { GetLPCLabwareInfoForURI } from '.'
import type {
  FlexAddressableAreaName,
  LabwareDefinition2,
} from '@opentrons/shared-data'

interface GetDefaultOffsetDetailsForLabwareParams
  extends GetLPCLabwareInfoForURI {
  locationSpecificOffsetDetails: LocationSpecificOffsetDetails[]
}

export function getDefaultOffsetDetailsForLabware(
  params: GetDefaultOffsetDetailsForLabwareParams
): DefaultOffsetDetails {
  const { lwLocInfo, uri, currentOffsets } = params
  const aLabwareId =
    lwLocInfo?.find(combo => combo.definitionUri === uri)?.labwareId ?? ''

  const existingOffset =
    currentOffsets?.find(
      offset =>
        offset.locationSequence === ANY_LOCATION && offset.definitionUri === uri
    ) ?? null

  const { lwModOnlyStackupDetails, closestBeneathAdapterId } = getStackupInfo({
    ...params,
    aLabwareId,
  })

  return {
    workingOffset: null,
    existingOffset,
    locationDetails: {
      labwareId: aLabwareId,
      definitionUri: uri,
      kind: OFFSET_KIND_DEFAULT,
      // We always do default offset LPCing in this slot.
      addressableAreaName: getValidDefaultOffsetLocation(
        params.lwLocInfo,
        params.protocolData
      ),
      lwOffsetLocSeq: ANY_LOCATION,
      closestBeneathAdapterId,
      // The only labware present on deck when configuring the default offset is the top-most labware itself.
      lwModOnlyStackupDetails,
    },
  }
}

interface GetStackingInfoParams
  extends GetDefaultOffsetDetailsForLabwareParams {
  aLabwareId: string
}

// Certain labware must be part of a stackup unconditionally (as noted by the 'stackingOnly' quirk),
// and cannot be placed directly on the deck as the sole labware when setting a default offset (ex, evotips).
// It must be accompanied by an adapter.
//
// In these circumstances, the default offset info should include adapter details, which the view
// layer utilizes for appropriate deck and copy rendering.
// We arbitrarily select the first adapter utilized in the run, which is also the adapter
// associated with the first location-specific offset.
function getStackupInfo({
  uri,
  labwareDefs,
  locationSpecificOffsetDetails,
  protocolData,
  aLabwareId,
}: GetStackingInfoParams): {
  lwModOnlyStackupDetails: LabwareModuleStackupDetails
  closestBeneathAdapterId: string | undefined
} {
  const requiresAdapterId = getRequiresAdapterId(uri, labwareDefs)

  const closestBeneathAdapterId = requiresAdapterId
    ? getFirstAdapterIdFrom(locationSpecificOffsetDetails)
    : undefined

  const adapterUri =
    protocolData?.labware.find(lw => lw.id === closestBeneathAdapterId)
      ?.definitionUri ?? ''

  const lwModOnlyStackupDetails: LabwareModuleStackupDetails = requiresAdapterId
    ? [
        {
          kind: 'labware',
          labwareUri: adapterUri,
          id: closestBeneathAdapterId ?? '',
        },
        { kind: 'labware', labwareUri: uri, id: aLabwareId },
      ]
    : [{ kind: 'labware', labwareUri: uri, id: aLabwareId }]

  if (
    requiresAdapterId &&
    (closestBeneathAdapterId == null || adapterUri == null)
  ) {
    console.error(
      `Expected to find required adapter for mandatory stackup for labware: ${uri}`
    )
  }

  return { lwModOnlyStackupDetails, closestBeneathAdapterId }
}

function getRequiresAdapterId(
  uri: string,
  labwareDefs: GetLPCLabwareInfoForURI['labwareDefs']
): boolean {
  const matchingDef =
    labwareDefs?.find(def => getLabwareDefURI(def) === uri) ?? null

  return requiresAdapter(matchingDef)
}

function requiresAdapter(def: LabwareDefinition2 | null): boolean {
  return def?.parameters.quirks?.includes('stackingOnly') ?? false
}

function getFirstAdapterIdFrom(
  lsOffsets: LocationSpecificOffsetDetails[]
): string | undefined {
  return lsOffsets.find(
    lsOffset => lsOffset.locationDetails.closestBeneathAdapterId != null
  )?.locationDetails.closestBeneathAdapterId
}

// Find a valid location for setting a default offset slot.
// A slot is valid if it does not contain a module.
// This util works under the assumption that modules cannot be added or removed
// from the deck mid-protocol run and that currently there is at least one
// slot on the deck without a module (true as of 8.4.0, since launching LPC requires
// the presence of a tiprack, which must occupy a non-module deck slot).
// NOTE: This util is meant to be temporary until product/design devise
// an alternative method for default offset location selection.
function getValidDefaultOffsetLocation(
  lwLocInfo: LabwareLocationInfo[],
  protocolData: GetStackingInfoParams['protocolData']
): FlexAddressableAreaName {
  const isSlotC2Unavailable =
    protocolData?.modules.some(
      mod => mod.location.slotName === C2_ADDRESSABLE_AREA
    ) ?? false

  if (isSlotC2Unavailable) {
    // Given all the LPC-able labware, find the first slot in which no module is
    // loaded beneath that labware.
    const locationWithNoModule = lwLocInfo.find(
      aLwLocInfo => aLwLocInfo.closestBeneathModuleId == null
    )
    return locationWithNoModule?.addressableAreaName ?? C3_ADDRESSABLE_AREA
  } else {
    return C2_ADDRESSABLE_AREA
  }
}
