import { getModuleDisplayName, getPipetteSpecsV2 } from '@opentrons/shared-data'

import type { TFunction } from 'i18next'
import type {
  CalibrationRunTimeCommand,
  GantryMount,
} from '@opentrons/shared-data'
import type { HandlesCommands } from '../types'

export function getCalibrationCommandText({
  command,
  commandTextData,
  t,
}: HandlesCommands<CalibrationRunTimeCommand>): string {
  switch (command.commandType) {
    case 'calibration/calibratePipette': {
      const { mount } = command.params
      const pipette = commandTextData?.pipettes.find(pip => pip.mount === mount)
      const pipetteName = getPipetteSpecsV2(pipette?.pipetteName)?.displayName
      return t('calibrate_pipette', {
        pipette: pipetteName,
        mount: gantryMountName(mount, t),
      })
    }
    case 'calibration/calibrateGripper': {
      const { jaw } = command.params
      return t('calibrate_gripper', {
        jaw: jaw === 'front' ? t('front') : t('rear'),
      })
    }
    case 'calibration/calibrateModule': {
      const { moduleId, labwareId, mount } = command.params
      const module = commandTextData?.modules.find(
        module => module.id === moduleId
      )
      const moduleName =
        module?.model != null
          ? getModuleDisplayName(module?.model)
          : 'unknown module'
      const labware = commandTextData?.labware.find(
        labware => labware.id === labwareId
      )
      const slotName = module?.location.slotName ?? 'unknown slot'
      const labwareName = labware?.displayName ?? 'unknown labware'
      const mountName = gantryMountName(mount, t)
      return t('calibrate_module', {
        module: moduleName,
        labware: labwareName,
        mount: mountName,
        slot: slotName,
      })
    }
    case 'calibration/moveToMaintenancePosition': {
      const { mount } = command.params
      return t('move_to_maintenance_position', {
        mount: gantryMountName(mount, t),
      })
    }
  }
}

const gantryMountName = (mount: GantryMount, t: TFunction): string => {
  switch (mount) {
    case 'left':
      return t('left_mount')
    case 'right':
      return t('right_mount')
    case 'extension':
      return t('extension_mount')
  }
}
