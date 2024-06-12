import { getCommands } from '@opentrons/api-client'
import { LEFT } from '@opentrons/shared-data'

import type {
  HostConfig,
  PipetteData,
  Run,
  CommandsData,
  RunCommandSummary,
  Instruments,
} from '@opentrons/api-client'
import type {
  LoadedPipette,
  PipettingRunTimeCommand,
} from '@opentrons/shared-data'

export interface GetPipettesWithTipAttached {
  host: HostConfig | null
  runId: string
  isFlex: boolean
  attachedInstruments?: Instruments
  runRecord?: Run
}

export function getPipettesWithTipAttached({
  host,
  runId,
  isFlex,
  attachedInstruments,
  runRecord,
}: GetPipettesWithTipAttached): Promise<PipetteData[]> {
  if (attachedInstruments == null || runRecord == null) {
    return Promise.resolve([])
  }

  return getCommandsExecutedDuringRun(
    host as HostConfig,
    runId
  ).then(executedCmdData =>
    checkPipettesForAttachedTips(
      executedCmdData.data,
      isFlex,
      runRecord.data.pipettes,
      attachedInstruments.data as PipetteData[]
    )
  )
}

function getCommandsExecutedDuringRun(
  host: HostConfig,
  runId: string
): Promise<CommandsData> {
  return getCommands(host, runId, {
    cursor: null,
    pageLength: 0,
  }).then(response => {
    const { totalLength } = response.data.meta
    return getCommands(host, runId, {
      cursor: 0,
      pageLength: totalLength,
    }).then(response => response.data)
  })
}

function checkPipettesForAttachedTips(
  commands: RunCommandSummary[],
  isFlex: boolean,
  pipettesUsedInRun: LoadedPipette[],
  attachedPipettes: PipetteData[]
): PipetteData[] {
  let pipettesWithUnknownTipStatus = pipettesUsedInRun
  let mountsWithTipAttached: Array<PipetteData['mount']> = []

  // Check if the Flex detects a tip attached.
  if (isFlex) {
    mountsWithTipAttached = pipettesWithUnknownTipStatus
      .filter(pipetteWithUnknownTipStatus =>
        attachedPipettes.some(
          attachedInstrument =>
            attachedInstrument.mount === pipetteWithUnknownTipStatus.mount &&
            attachedInstrument.state?.tipDetected
        )
      )
      .map(pipetteWithTipDetected => pipetteWithTipDetected.mount)

    pipettesWithUnknownTipStatus = pipettesWithUnknownTipStatus.filter(
      pipetteWithUnkownStatus =>
        !mountsWithTipAttached.includes(pipetteWithUnkownStatus.mount)
    )
  }

  const TIP_EXCHANGE_COMMAND_TYPES = ['dropTip', 'dropTipInPlace', 'pickUpTip']

  // Iterate backwards through commands, finding first tip exchange command for each pipette.
  // If there's a chance the tip is still attached, flag the pipette.
  for (let i = commands.length - 1; i >= 0; i--) {
    if (pipettesWithUnknownTipStatus.length === 0) {
      break
    }

    const commandType = commands[i].commandType
    const pipetteUsedInCommand = (commands[i] as PipettingRunTimeCommand).params
      .pipetteId
    const isTipExchangeCommand = TIP_EXCHANGE_COMMAND_TYPES.includes(
      commandType
    )
    const pipetteUsedInCommandWithUnknownTipStatus =
      pipettesWithUnknownTipStatus.find(
        pipette => pipette.id === pipetteUsedInCommand
      ) ?? null

    // If the currently iterated command is a fixit command, we can safely assume the user
    // had the option to fix pipettes with tips in this command and all commands
    // earlier in the run, during Error Recovery flows.
    if (
      commands[i].intent === 'fixit' &&
      isTipExchangeCommand &&
      commands[i].status === 'succeeded'
    ) {
      break
    }

    if (
      isTipExchangeCommand &&
      pipetteUsedInCommandWithUnknownTipStatus != null
    ) {
      const tipPossiblyAttached =
        commands[i].status !== 'succeeded' || commandType === 'pickUpTip'

      if (tipPossiblyAttached) {
        mountsWithTipAttached.push(
          pipetteUsedInCommandWithUnknownTipStatus.mount
        )
      }
      pipettesWithUnknownTipStatus = pipettesWithUnknownTipStatus.filter(
        pipette => pipette.id !== pipetteUsedInCommand
      )
    }
  }

  // Convert the array of mounts with attached tips to PipetteData with attached tips.
  const pipettesWithTipAttached = attachedPipettes.filter(attachedPipette =>
    mountsWithTipAttached.includes(attachedPipette.mount)
  )

  // Preferentially assign the left mount as the first element.
  if (
    pipettesWithTipAttached.length === 2 &&
    pipettesWithTipAttached[1].mount === LEFT
  ) {
    ;[pipettesWithTipAttached[0], pipettesWithTipAttached[1]] = [
      pipettesWithTipAttached[1],
      pipettesWithTipAttached[0],
    ]
  }

  return pipettesWithTipAttached
}
