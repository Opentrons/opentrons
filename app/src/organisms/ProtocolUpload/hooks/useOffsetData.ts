import reduce from 'lodash/reduce'
import { IDENTITY_VECTOR } from '@opentrons/shared-data'
import { useHost } from '@opentrons/react-api-client'
import { HostConfig, getCommand, VectorOffset } from '@opentrons/api-client'
import { useCurrentRunId } from './useCurrentRunId'
import type { SavePositionCommandData } from '../../ProtocolSetup/LabwarePositionCheck/types'
interface LabwareOffsetData {
  [labwareId: string]: VectorOffset
}

export function useOffsetDataByLabwareId(
  savePositionCommandData: SavePositionCommandData
): Promise<LabwareOffsetData> {
  const host = useHost()
  const currentRunId = useCurrentRunId()
  // make sure we have exactly two save position command ids per labware id
  Object.entries(savePositionCommandData).forEach(([labwareId, commandIds]) => {
    if (commandIds.length !== 2) {
      throw new Error(
        `expected exactly two save position commands ids for labware id: ${labwareId}, but got ${commandIds.length}`
      )
    }
  })

  return reduce<SavePositionCommandData, Promise<LabwareOffsetData>>(
    savePositionCommandData,
    (acc, commandIds, labwareId): Promise<LabwareOffsetData> => {
      const firstPosition: Promise<VectorOffset> = getCommand(
        host as HostConfig,
        currentRunId as string,
        commandIds[0]
      ).then(result => {
        return result.data.data.result.position
      })

      const secondPosition: Promise<VectorOffset> = getCommand(
        host as HostConfig,
        currentRunId as string,
        commandIds[1]
      ).then(result => {
        return result.data.data.result.position
      })

      const labwareOffset: Promise<LabwareOffsetData> = Promise.all([
        firstPosition,
        secondPosition,
      ])
        .then(positions => {
          const p1 = positions[0]
          const p2 = positions[1]
          const { x: firstX, y: firstY, z: firstZ } = p1
          const { x: secondX, y: secondY, z: secondZ } = p2
          return {
            [labwareId]: {
              x: secondX - firstX,
              y: secondY - firstY,
              z: secondZ - firstZ,
            },
          }
        })
        .catch((e: Error) => {
          console.error(`error calculating labware offset: ${e.message}`)
          return { [labwareId]: IDENTITY_VECTOR }
        })

      return acc.then(offsetData => {
        return labwareOffset.then(labwareOffset => {
          return { ...offsetData, ...labwareOffset }
        })
      })
    },
    Promise.resolve({})
  )
}
