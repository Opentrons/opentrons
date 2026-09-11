import { getModuleDisplayName, getPipetteSpecsV2 } from '@opentrons/shared-data'

import { getLabwareDisplayLocation } from '../getLabwareDisplayLocation'

import type { TFunction } from 'i18next'
import type {
  MotorAxes,
  RunTimeCommand,
  UnsafeRunTimeCommand,
} from '@opentrons/shared-data'
import type { CommandTextData, HandlesCommands } from '../types'

export function getUnsafeCommandText({
  command,
  allRunDefs,
  t,
  commandTextData,
  robotType,
}: HandlesCommands<UnsafeRunTimeCommand>): string {
  switch (command.commandType) {
    case 'unsafe/blowOutInPlace': {
      const flowRate = formatCmdParamDecimal(command, 'flowRate')
      const pipetteName = getPipetteDisplayName(
        command.params.pipetteId,
        commandTextData
      )
      return t('blowout_in_place', {
        pipette: pipetteName,
        flow_rate: flowRate,
      })
    }
    case 'unsafe/dropTipInPlace':
      return t('drop_tip_in_place')
    case 'unsafe/updatePositionEstimators': {
      const axesText = getAxesText(command.params.axes, t)
      return t('update_position_estimators', { axes: axesText })
    }
    case 'unsafe/engageAxes': {
      const axesText = getAxesText(command.params.axes, t)
      return t('engage_axes', { axes: axesText })
    }
    case 'unsafe/ungripLabware':
      return t('ungrip_labware')
    case 'unsafe/placeLabware': {
      const { labwareURI, location } = command.params
      const labwareName = commandTextData?.labware.find(
        labware => labware.definitionUri === labwareURI
      )?.displayName
      const locationText = getLabwareDisplayLocation({
        location,
        robotType,
        allRunDefs,
        loadedLabwares: commandTextData?.labware ?? [],
        loadedModules: commandTextData?.modules ?? [],
        t,
      })

      return t('place_labware', {
        labware: labwareName,
        location: locationText,
      })
    }
    case 'unsafe/flexStacker/manualRetrieve': {
      const { moduleId } = command.params
      const moduleName = getModuleDisplayNameFromId(moduleId, commandTextData)
      return t('manual_retrieve', {
        module: moduleName,
      })
    }
    case 'unsafe/flexStacker/closeLatch': {
      const { moduleId } = command.params
      const moduleName = getModuleDisplayNameFromId(moduleId, commandTextData)
      return t('close_latch', {
        module: moduleName,
      })
    }
    case 'unsafe/flexStacker/openLatch': {
      const { moduleId } = command.params
      const moduleName = getModuleDisplayNameFromId(moduleId, commandTextData)
      return t('open_latch', {
        module: moduleName,
      })
    }
    case 'unsafe/flexStacker/prepareShuttle': {
      const { moduleId } = command.params
      const moduleName = getModuleDisplayNameFromId(moduleId, commandTextData)
      return t('prepare_shuttle', {
        module: moduleName,
      })
    }
  }
}

// Format the given command param to two decimals if it exists and can be cast as a number.
const formatCmdParamDecimal = (
  command: RunTimeCommand | null | undefined,
  paramName: string
): string | null =>
  command?.params &&
  paramName in command.params &&
  command.params[paramName as keyof typeof command.params] != null
    ? Number(command.params[paramName as keyof typeof command.params]).toFixed(
        2
      )
    : null

const getPipetteDisplayName = (
  pipetteId: string,
  commandTextData: CommandTextData | null
): string => {
  const pipette = commandTextData?.pipettes.find(pip => pip.id === pipetteId)
  return getPipetteSpecsV2(pipette?.pipetteName)?.displayName ?? ''
}

const getAxesText = (axes: MotorAxes, t: TFunction): string => {
  return axes
    .map(axis => {
      switch (axis) {
        case 'leftZ':
          return t('left_z')
        case 'rightZ':
          return t('right_z')
        case 'leftPlunger':
          return t('left_plunger')
        case 'rightPlunger':
          return t('right_plunger')
        case 'extensionZ':
          return t('extension_z')
        case 'extensionJaw':
          return t('extension_jaw')
        case 'axis96ChannelCam':
          return t('axis96ChannelCam')
        default:
          return t(axis)
      }
    })
    .join(', ')
}

const getModuleDisplayNameFromId = (
  moduleId: string,
  commandTextData: CommandTextData | null
): string => {
  const module = commandTextData?.modules.find(module => module.id === moduleId)
  return module?.model != null
    ? getModuleDisplayName(module?.model)
    : 'unknown module'
}
