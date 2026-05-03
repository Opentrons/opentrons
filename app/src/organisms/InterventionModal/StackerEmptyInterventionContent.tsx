import { css } from 'styled-components'

import {
  AnimationVideo,
  BORDERS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
} from '@opentrons/components'
import { useRunCurrentState } from '@opentrons/react-api-client'
import {
  getLoadedLabwareDefinitionsByUri,
  getStackerLocationFromSlotName,
} from '@opentrons/shared-data'

import EmptyHopper from '/app/assets/videos/error-recovery/FlexStacker_EmptyHopper.webm'
import { InterventionInfo } from '/app/molecules/InterventionModal/InterventionContent'

import { InterventionCommandMessage } from './InterventionCommandMessage'

import type { ComponentProps } from 'react'
import type { RunData } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  FlexStackerEmptyRunTimeCommand,
} from '@opentrons/shared-data'

const STACKER_IMAGE_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  border-radius: ${BORDERS.borderRadius16};
`

export interface StackerEmptyInterventionProps {
  command: FlexStackerEmptyRunTimeCommand
  analysis: CompletedProtocolAnalysis | null
  run: RunData
}

export function StackerEmptyInterventionContent({
  command,
  analysis,
  run,
}: StackerEmptyInterventionProps): JSX.Element | null {
  const { data: runCurrentState } = useRunCurrentState(run.id)
  const flexStacker =
    runCurrentState?.data.flexStackerStates?.[command.params.moduleId] ?? null

  const analysisCommands = analysis?.commands ?? []
  const labwareDefsByUri = getLoadedLabwareDefinitionsByUri(analysisCommands)

  // Get the name of the labware to be removed from the stacker
  let labwareName: string | null = null
  if (flexStacker) {
    const labwareDef = labwareDefsByUri?.[flexStacker.primaryLabwareURI] ?? null
    labwareName = labwareDef?.metadata.displayName ?? null
  }

  const moduleLocation =
    run?.modules.find(m => m.id === command.params.moduleId)?.location ?? null

  if (
    moduleLocation?.slotName == null ||
    labwareName == null ||
    flexStacker == null
  ) {
    return null
  }

  const infoProps: ComponentProps<typeof InterventionInfo> = {
    layout: 'default',
    type: 'location',
    labwareName: labwareName ?? '',
    currentLocationProps: {
      deckLabel: getStackerLocationFromSlotName(moduleLocation.slotName),
    },
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      width="100%"
    >
      <Flex gridGap={SPACING.spacing32}>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing12}
          width="50%"
        >
          <InterventionInfo {...infoProps} />
          <InterventionCommandMessage
            commandMessage={command.params.message ?? null}
          />
        </Flex>
        <Flex width="50%" css={STACKER_IMAGE_STYLE}>
          <AnimationVideo role="presentation" width="100%">
            <source src={EmptyHopper} data-testid="empty-animation" />
          </AnimationVideo>
        </Flex>
      </Flex>
    </Flex>
  )
}
