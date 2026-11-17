import * as errorCreators from '../../errorCreators'
import {
  getTrashBinAddressableAreaName,
  getWasteChuteAddressableAreaNamePip,
  resolveNumericRuntimeValue,
  resolveStringRuntimeValue,
  uuid,
} from '../../utils'

import type { AddressableAreaName, CutoutId } from '@opentrons/shared-data'
import type { CommandCreator, CommandCreatorError } from '../../types'

interface MoveToAddressableAreaAtomicParams {
  pipetteId: string
  fixtureId: string
  offset: {
    x: number | string
    y: number | string
    z: number | string
  }
  speed?: number | string
  minimumZHeight?: number | string
  forceDirect?: boolean | string
  stayAtHighestPossibleZ?: boolean | string
}
export const moveToAddressableArea: CommandCreator<
  MoveToAddressableAreaAtomicParams
> = (args, invariantContext, prevRobotState) => {
  const { offset } = args
  const {
    pipetteEntities,
    trashBinEntities,
    wasteChuteEntities,
    runtimeParameters,
  } = invariantContext
  const pipetteId = resolveStringRuntimeValue(args.pipetteId, runtimeParameters)
  const fixtureId = resolveStringRuntimeValue(args.fixtureId, runtimeParameters)
  const x = resolveNumericRuntimeValue(offset.x, runtimeParameters)
  const y = resolveNumericRuntimeValue(offset.y, runtimeParameters)
  const z = resolveNumericRuntimeValue(offset.z, runtimeParameters)
  const errors: CommandCreatorError[] = []
  if (pipetteId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.pipetteId })
    )
  }
  if (fixtureId == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: args.fixtureId })
    )
  }
  if (typeof offset.x === 'string' && x == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: offset.x })
    )
  }
  if (typeof offset.y === 'string' && y == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: offset.y })
    )
  }
  if (typeof offset.z === 'string' && z == null) {
    errors.push(
      errorCreators.invalidRuntimeParameter({ parameterName: offset.z })
    )
  }
  if (
    errors.length > 0 ||
    pipetteId == null ||
    fixtureId == null ||
    x == null ||
    y == null ||
    z == null
  ) {
    return { errors }
  }
  const pipetteEntity = pipetteEntities[pipetteId]
  const pipetteChannels = pipetteEntity.spec.channels
  const pipettePythonName = pipetteEntity.pythonName
  const fixtureEntity =
    trashBinEntities[fixtureId] ?? wasteChuteEntities[fixtureId]
  const fixturePythonName = fixtureEntity.pythonName

  let addressableAreaName: AddressableAreaName =
    getWasteChuteAddressableAreaNamePip(pipetteChannels)
  if (trashBinEntities[fixtureId] != null) {
    addressableAreaName = getTrashBinAddressableAreaName(
      fixtureEntity.location as CutoutId
    )
  }

  const commands = [
    {
      commandType: 'moveToAddressableArea' as const,
      key: uuid(),
      params: {
        pipetteId,
        addressableAreaName,
        offset: { x, y, z },
      },
    },
  ]
  return {
    commands,
    python: `${pipettePythonName}.move_to(${fixturePythonName})`,
  }
}
