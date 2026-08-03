import { getLabwareDefURI, getPipetteSpecsV2 } from '@opentrons/shared-data'

import { getAddressableAreaDisplayName } from '../getAddressableAreaDisplayName'
import { getFinalMoveToAddressableAreaCmd } from '../getFinalAddressableAreaCmd'
import { getFinalLabwareLocation } from '../getFinalLabwareLocation'
import { getLabwareDefinitionsFromCommands } from '../getLabwareDefinitionsFromCommands'
import { getLabwareDisplayLocation } from '../getLabwareDisplayLocation'
import { getLabwareName } from '../getLabwareName'
import { getLoadedLabware } from '../getLoadedLabware'
import { getWellRange } from '../getWellRange'

import type {
  PipetteName,
  PipettingRunTimeCommand,
  RunTimeCommand,
} from '@opentrons/shared-data'
import type { HandlesCommands } from '../..'

export const getPipettingCommandText = ({
  command,
  allRunDefs,
  commandTextData,
  robotType,
  t,
}: HandlesCommands<PipettingRunTimeCommand>): string => {
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
  const labwareLocationFromCommands =
    allPreviousCommands != null
      ? getFinalLabwareLocation(
          labwareId,
          allPreviousCommands as RunTimeCommand[]
        )
      : null

  const loadedLabware =
    commandTextData != null
      ? getLoadedLabware(commandTextData.labware ?? [], labwareId)
      : null

  // Prefer location derived from prior commands; fall back to the run's loaded
  // labware location (needed when command history IDs don't match, e.g. fixit
  // commands documented against protocol-analysis command lists).
  const displayLocation = getLabwareDisplayLocation({
    loadedLabwares: commandTextData?.labware ?? [],
    location:
      labwareLocationFromCommands?.locationSequence ??
      labwareLocationFromCommands?.location ??
      loadedLabware?.location ??
      null,
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
    case 'aspirateWhileTracking': {
      const trackFromLocation = command.params.trackFromLocation
      const trackToLocation = command.params.trackToLocation
      const fromOriginStr =
        trackFromLocation.origin === 'meniscus' ? 'meniscus+' : ''
      const toOriginStr =
        trackToLocation.origin === 'meniscus' ? 'meniscus+' : ''
      const fromOffset = `(${trackFromLocation.offset.x}, ${trackFromLocation.offset.y}, ${trackFromLocation.offset.z})`
      const toOffset = `(${trackToLocation.offset.x}, ${trackToLocation.offset.y}, ${trackToLocation.offset.z})`
      const trackFromString = `${fromOriginStr}${fromOffset}`
      const trackToString = `${toOriginStr}${toOffset}`
      return t('aspirate_while_tracking', {
        well_name: wellName,
        track_from_location: trackFromString,
        track_to_location: trackToString,
        labware: labwareName,
        labware_location: displayLocation,
        volume,
        flow_rate: flowRate,
      })
    }
    case 'dispenseWhileTracking': {
      const trackFromLocation = command.params.trackFromLocation
      const trackToLocation = command.params.trackToLocation
      const fromOriginStr =
        trackFromLocation.origin === 'meniscus' ? 'meniscus+' : ''
      const toOriginStr =
        trackToLocation.origin === 'meniscus' ? 'meniscus+' : ''
      const fromOffset = `(${trackFromLocation.offset.x}, ${trackFromLocation.offset.y}, ${trackFromLocation.offset.z})`
      const toOffset = `(${trackToLocation.offset.x}, ${trackToLocation.offset.y}, ${trackToLocation.offset.z})`
      const trackFromString = `${fromOriginStr}${fromOffset}`
      const trackToString = `${toOriginStr}${toOffset}`
      return t('dispense_while_tracking', {
        well_name: wellName,
        track_from_location: trackFromString,
        track_to_location: trackToString,
        labware: labwareName,
        labware_location: displayLocation,
        volume,
        flow_rate: flowRate,
        push_out_volume: pushOutVolume,
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
      const pipetteName: PipetteName | undefined =
        commandTextData?.pipettes.find(
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
    case 'verifyTipPresence': {
      const pipetteId = command.params.pipetteId
      const pipette = commandTextData?.pipettes.find(
        pipette => pipette.id === pipetteId
      )
      const mount =
        pipette?.mount === 'left' ? t('left_mount') : t('right_mount')
      const presence = !!command.params.expectedState
        ? t(command.params.expectedState)
        : ''

      const pipetteName = getPipetteSpecsV2(pipette?.pipetteName)?.displayName

      return t('verifying_tip_presence', {
        presence,
        pipette: pipetteName,
        mount,
      })
    }
    case 'getTipPresence': {
      const pipetteId = command.params.pipetteId
      const pipette = commandTextData?.pipettes.find(
        pipette => pipette.id === pipetteId
      )
      const pipetteName = getPipetteSpecsV2(pipette?.pipetteName)?.displayName
      return t('get_tip_presence', {
        pipette: pipetteName,
      })
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
