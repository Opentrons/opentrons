import isEqual from 'lodash/isEqual'

import { ANY_LOCATION } from '@opentrons/api-client'

import type {
  LabwareOffsetLocationSequenceComponent,
  StoredLabwareOffset,
  VectorOffset,
} from '@opentrons/api-client'
import type {
  ApplyWorkingOffsetsAction,
  LocationSpecificOffsetDetails,
  LPCLabwareInfo,
  LPCWizardState,
  LwGeometryDetails,
} from '/app/redux/protocol-runs'

export function handleApplyWorkingOffsets(
  state: LPCWizardState,
  action: ApplyWorkingOffsetsAction
): LPCLabwareInfo['labware'] {
  const { saveResult } = action.payload
  const [updatedOffsets, deletedOffsets] = saveResult

  return Object.entries(state.labwareInfo.labware).reduce<
    LPCLabwareInfo['labware']
  >((acc, [definitionUri, details]) => {
    let updatedDetails = { ...details }

    // Find offset updates.
    const updates = updatedOffsets.filter(
      offset => offset.definitionUri === definitionUri
    )

    // Process offset updates, if any.
    if (updates.length > 0) {
      updatedDetails = processOffsetUpdates(updatedDetails, updates)
    }

    // Find offset deletions.
    const deletions = deletedOffsets.filter(
      offset => offset.definitionUri === definitionUri
    )

    // Process offset deletions, if any.
    if (deletions.length > 0) {
      updatedDetails = processOffsetDeletions(updatedDetails, deletions)
    }

    acc[definitionUri] = updatedDetails
    return acc
  }, {})
}

function processOffsetUpdates(
  updatedDetails: LwGeometryDetails,
  updatedOffsets: StoredLabwareOffset[]
): LwGeometryDetails {
  updatedOffsets.forEach(updatedOffset => {
    const { vector, id, createdAt, locationSequence } = updatedOffset
    const offsetData = { vector, id, createdAt }

    if (locationSequence === ANY_LOCATION) {
      updatedDetails = updateDefaultOffset(updatedDetails, updatedOffset)
    } else {
      updatedDetails = updateLocationSpecificOffset(
        updatedDetails,
        updatedOffset,
        offsetData
      )
    }
  })

  return updatedDetails
}

function processOffsetDeletions(
  updatedDetails: LwGeometryDetails,
  deletions: StoredLabwareOffset[]
): LwGeometryDetails {
  // There is currently no support for deleting a default offset.
  deletions.forEach(deletion => {
    updatedDetails = updateLocationSpecificOffset(
      updatedDetails,
      deletion,
      null
    )
  })

  return updatedDetails
}

function updateDefaultOffset(
  details: LwGeometryDetails,
  offset: StoredLabwareOffset
): LwGeometryDetails {
  const { vector, id, createdAt } = offset

  return {
    ...details,
    defaultOffsetDetails: {
      ...details.defaultOffsetDetails,
      workingOffset: null,
      existingOffset: { vector, id, createdAt },
      locationDetails: {
        ...details.defaultOffsetDetails.locationDetails,
      },
    },
  }
}

interface OffsetData {
  vector: VectorOffset
  id: string
  createdAt: string
}

function updateLocationSpecificOffset(
  details: LwGeometryDetails,
  offset: StoredLabwareOffset,
  existingOffset: OffsetData | null
): LwGeometryDetails {
  const { locationSequence } = offset
  const lsDetails = details.locationSpecificOffsetDetails
  const matchIndex = findMatchingLocationOffset(
    lsDetails,
    locationSequence as LabwareOffsetLocationSequenceComponent[]
  )

  if (matchIndex === -1) {
    console.error(
      'Expected to find matching location sequence for offset but did not.'
    )
    return details
  }

  const nonMatchingDetails = [
    ...lsDetails.slice(0, matchIndex),
    ...lsDetails.slice(matchIndex + 1),
  ]

  const updatedMatchingDetail = {
    ...lsDetails[matchIndex],
    workingOffset: null,
    existingOffset,
  }

  return {
    ...details,
    locationSpecificOffsetDetails: [
      ...nonMatchingDetails,
      updatedMatchingDetail,
    ],
  }
}

function findMatchingLocationOffset(
  locationOffsets: LocationSpecificOffsetDetails[],
  locationSequence: LabwareOffsetLocationSequenceComponent[]
): number {
  return locationOffsets.findIndex(detail =>
    isEqual(detail.locationDetails.lwOffsetLocSeq, locationSequence)
  )
}
