import { getLabwareDefURI } from '@opentrons/shared-data'

import { getFinalLabwareLocation } from '../getFinalLabwareLocation'
import { getWellRange } from '../getWellRange'
import { getLabwareDisplayLocation } from '../getLabwareDisplayLocation'
import { getLabwareName } from '../getLabwareName'
import { getLoadedLabware } from '../getLoadedLabware'
import { getLabwareDefinitionsFromCommands } from '../getLabwareDefinitionsFromCommands'
import { getFinalMoveToAddressableAreaCmd } from '../getFinalAddressableAreaCmd'
import { getAddressableAreaDisplayName } from '../getAddressableAreaDisplayName'
import type { PipetteName, RunTimeCommand } from '@opentrons/shared-data'
import type { GetCommandText } from '../..'

export const getPipettingCommandText = ({
  command,
  allRunDefs,
  commandTextData,
  robotType,
  t,
}: GetCommandText): string => {
  const labwareId =
    command != null && 'labwareId' in command.params
      ? (command.params.labwareId as string)
      : ''
  const wellName =
    command != null && 'wellName' in command.params
      ? command.params.wellName
      : ''

  const allPreviousCommands = commandTextData?.commands.slice(
    0,
    commandTextData.commands.findIndex(c => c.id === command?.id)
  )
  const labwareLocation =
    allPreviousCommands != null
      ? getFinalLabwareLocation(
          labwareId,
          allPreviousCommands as RunTimeCommand[]
        )
      : null

  const displayLocation = getLabwareDisplayLocation({
    loadedLabwares: commandTextData?.labware ?? [],
    location: labwareLocation?.locationSequence ?? labwareLocation?.location,
    robotType,
    allRunDefs,
    loadedModules: commandTextData?.modules ?? [],
    t,
  })

  const labwareName =
    commandTextData != null
      ? getLabwareName({
          loadedLabwares: commandTextData.labware ?? [],
          labwareId,
          allRunDefs,
        })
      : null

  const volume = formatCmdParamDecimal(command, 'volume')
  const flowRate = formatCmdParamDecimal(command, 'flowRate')
  const pushOutVolume = formatCmdParamDecimal(command, 'pushOut')

  switch (command?.commandType) {
    case 'aspirate': {
      return t('aspirate', {
        well_name: wellName,
        labware: labwareName,
        labware_location: displayLocation,
        volume,
        flow_rate: flowRate,
      })
    }
    case 'dispense': {
      return pushOutVolume != null
        ? t('dispense_push_out', {
            well_name: wellName,
            labware: labwareName,
            labware_location: displayLocation,
            volume,
            flow_rate: flowRate,
            push_out_volume: pushOutVolume,
          })
        : t('dispense', {
            well_name: wellName,
            labware: labwareName,
            labware_location: displayLocation,
            volume,
            flow_rate: flowRate,
          })
    }
    case 'blowout': {
      return t('blowout', {
        well_name: wellName,
        labware: labwareName,
        labware_location: displayLocation,
        flow_rate: flowRate,
      })
    }
    case 'dropTip': {
      const loadedLabware =
        commandTextData != null
          ? getLoadedLabware(commandTextData.labware ?? [], labwareId)
          : null
      const labwareDefinitions =
        commandTextData != null
          ? getLabwareDefinitionsFromCommands(
              commandTextData.commands as RunTimeCommand[]
            )
          : null
      const labwareDef = labwareDefinitions?.find(
        lw => getLabwareDefURI(lw) === loadedLabware?.definitionUri
      )
      return Boolean(labwareDef?.parameters.isTiprack)
        ? t('return_tip', {
            well_name: wellName,
            labware: labwareName,
            labware_location: displayLocation,
          })
        : t('drop_tip', {
            well_name: wellName,
            labware: labwareName,
          })
    }
    case 'pickUpTip': {
      const pipetteId = command.params.pipetteId
      const pipetteName:
        | PipetteName
        | undefined = commandTextData?.pipettes.find(
        pipette => pipette.id === pipetteId
      )?.pipetteName

      return t('pickup_tip', {
        well_range:
          allPreviousCommands != null
            ? getWellRange(
                pipetteId,
                allPreviousCommands as RunTimeCommand[],
                wellName as string,
                pipetteName
              )
            : null,
        labware: labwareName,
        labware_location: displayLocation,
      })
    }
    case 'dropTipInPlace': {
      const cmd = getFinalMoveToAddressableAreaCmd(allPreviousCommands ?? [])

      if (cmd != null) {
        const displayName = getAddressableAreaDisplayName([cmd], cmd?.id, t)
        return t('dropping_tip_in_trash', { trash: displayName })
      } else {
        return t('drop_tip_in_place')
      }
    }
    case 'dispenseInPlace': {
      return t('dispense_in_place', { volume, flow_rate: flowRate })
    }
    case 'blowOutInPlace': {
      return t('blowout_in_place', { flow_rate: flowRate })
    }
    case 'aspirateInPlace': {
      return t('aspirate_in_place', { volume, flow_rate: flowRate })
    }
    case 'airGapInPlace': {
      return t('air_gap_in_place', { volume })
    }
    case 'sealPipetteToTip': {
      return t('sealing_to_location', {
        labware: labwareName,
        location: displayLocation,
      })
    }
    case 'unsealPipetteFromTip': {
      return t('unsealing_from_location', {
        labware: labwareName,
        location: displayLocation,
      })
    }
    case 'pressureDispense': {
      return t('pressurizing_to_dispense', { volume, flow_rate: flowRate })
    }
    default: {
      console.warn(
        'PipettingCommandText encountered a command with an unrecognized commandType: ',
        command
      )
      return ''
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
