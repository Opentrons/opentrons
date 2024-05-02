import { getInitialLoadedLabwareByAdapter } from './getInitiallyLoadedLabwareByAdapter'
import type {
  CompletedProtocolAnalysis,
  LoadLabwareRunTimeCommand,
  MoveLabwareRunTimeCommand,
  ProtocolAnalysisOutput,
  LabwareDefinition2,
} from '@opentrons/shared-data'

interface LabwareInSlot {
  labwareId: string
  labwareDef: LabwareDefinition2
  labwareNickName: string | null
  location: { slotName: string }
}

export const getInitialAndMovedLabwareInSlots = (
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
): LabwareInSlot[] => {
  const { commands } = protocolAnalysis
  const initialLoadedLabwareByAdapter = getInitialLoadedLabwareByAdapter(
    commands
  )
  const topMostLabwareInSlots = getTopMostLabwareInSlots(protocolAnalysis)

  return commands
    .filter(
      (command): command is MoveLabwareRunTimeCommand =>
        command.commandType === 'moveLabware'
    )
    .reduce<LabwareInSlot[]>((acc, command) => {
      const labwareId = command.params.labwareId
      const location = command.params.newLocation

      const originalLabware = topMostLabwareInSlots.find(
        labware => labware.labwareId === labwareId
      )
      const labwareDef = originalLabware?.labwareDef

      if (
        location === 'offDeck' ||
        'moduleId' in location ||
        'labwareId' in location
      )
        return acc
      if (labwareId == null) {
        console.warn('expected to find labware id but could not')
        return acc
      }
      if (labwareDef == null) {
        console.warn(
          `expected to find labware def for labware id ${String(
            labwareId
          )} but could not`
        )
        return acc
      }

      const slotName =
        'addressableAreaName' in location
          ? location.addressableAreaName
          : location.slotName

      // if list of labware already includes slotName, return acc
      if (acc.find(labware => labware.location.slotName === slotName) != null) {
        return acc
      }

      const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]

      //  NOTE: only grabbing the labware on top most layer so
      //  either the adapter or the labware but not both
      const topLabwareDefinition =
        labwareInAdapter?.result?.definition ?? labwareDef
      const topLabwareId = labwareInAdapter?.result?.labwareId ?? labwareId
      const topLabwareNickName =
        labwareInAdapter?.params?.displayName ??
        originalLabware?.labwareNickName ??
        null

      return [
        ...acc,
        {
          labwareId: topLabwareId,
          labwareDef: topLabwareDefinition,
          labwareNickName: topLabwareNickName,
          location: { slotName },
        },
      ]
    }, topMostLabwareInSlots)
}

export const getTopMostLabwareInSlots = (
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput
): LabwareInSlot[] => {
  const { commands } = protocolAnalysis
  const initialLoadedLabwareByAdapter = getInitialLoadedLabwareByAdapter(
    commands
  )
  return commands
    .filter(
      (command): command is LoadLabwareRunTimeCommand =>
        command.commandType === 'loadLabware'
    )
    .reduce<LabwareInSlot[]>((acc, command) => {
      const labwareId = command.result?.labwareId
      const location = command.params.location
      const labwareDef = command.result?.definition
      if (
        location === 'offDeck' ||
        'moduleId' in location ||
        'labwareId' in location
      )
        return acc
      if (labwareId == null) {
        console.warn('expected to find labware id but could not')
        return acc
      }
      if (labwareDef == null) {
        console.warn(
          `expected to find labware def for labware id ${String(
            labwareId
          )} but could not`
        )
        return acc
      }

      const slotName =
        'addressableAreaName' in location
          ? location.addressableAreaName
          : location.slotName

      const labwareInAdapter = initialLoadedLabwareByAdapter[labwareId]

      //  NOTE: only grabbing the labware on top most layer so
      //  either the adapter or the labware but not both
      const topLabwareDefinition =
        labwareInAdapter?.result?.definition ?? labwareDef
      const topLabwareId = labwareInAdapter?.result?.labwareId ?? labwareId
      const topLabwareNickName =
        labwareInAdapter?.params?.displayName ??
        command.params.displayName ??
        null

      return [
        ...acc,
        {
          labwareId: topLabwareId,
          labwareDef: topLabwareDefinition,
          labwareNickName: topLabwareNickName,
          location: { slotName },
        },
      ]
    }, [])
}
