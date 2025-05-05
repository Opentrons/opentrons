import { ComponentProps } from 'react'
import { css } from 'styled-components'

import {
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  LegacyStyledText,
  SPACING,
} from '@opentrons/components'
import { useRunCurrentState } from '@opentrons/react-api-client'
import { getLoadedLabwareDefinitionsByUri } from '@opentrons/shared-data'

import { InterventionInfo } from '/app/molecules/InterventionModal/InterventionContent'
import { getStackerLocationFromSlotName } from '/app/transformations/commands'

import { InterventionCommandMessage } from './InterventionCommandMessage'

import type { RunData } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  FlexStackerFillRunTimeCommand,
  ModuleLocation,
} from '@opentrons/shared-data'

const STACKER_IMAGE_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing8};
  padding: ${SPACING.spacing16};
  background-color: ${COLORS.grey35};
  border-radius: ${BORDERS.lineBorder};
`

export interface StackerFillInterventionProps {
  command: FlexStackerFillRunTimeCommand
  analysis: CompletedProtocolAnalysis | null
  run: RunData
}

export function StackerFillInterventionContent({
  command,
  analysis,
  run,
}: StackerFillInterventionProps): JSX.Element | null {
  const { data: runCurrentState } = useRunCurrentState(run.id)
  const flexStacker =
    runCurrentState?.data.flexStackerStates?.[command.params.moduleId] ?? null

  const analysisCommands = analysis?.commands ?? []
  const labwareDefsByUri = getLoadedLabwareDefinitionsByUri(analysisCommands)

  // Get the name of the labware to be removed from the stacker
  let labwareName: string | null = null
  let labwareCount = command.params.count ?? null
  if (flexStacker) {
    const labwareDef = labwareDefsByUri?.[flexStacker.primaryLabwareURI] ?? null
    labwareName = labwareDef?.metadata.displayName ?? null
    if (labwareCount == null) {
      labwareCount = flexStacker.maxCount
    }
  }

  const moduleLocation =
    run?.modules.find(m => m.id === command.params.moduleId)?.location ?? null

  if (
    moduleLocation?.slotName == null ||
    labwareName == null ||
    flexStacker == null ||
    labwareCount == null
  )
    return null

  const infoProps: ComponentProps<typeof InterventionInfo> = {
    layout: 'default',
    type: 'location-quantity',
    labwareName: labwareName ?? '',
    currentLocationProps: {
      deckLabel: getStackerLocationFromSlotName(moduleLocation.slotName),
    },
    quantity: labwareCount,
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
          <Box margin="0 auto" width="100%">
            {/* TODO (chb, 04-30-2025): Replace this with proper fill content */}
            <LegacyStyledText as="p">
              {'Replace me with a Stacker Fill image/animation'}
            </LegacyStyledText>
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}
