import { RunData } from '@opentrons/api-client'
import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  COLORS,
  DeckInfoLabel,
  DIRECTION_COLUMN,
  DISPLAY_NONE,
  Flex,
  LegacyStyledText,
  RESPONSIVENESS,
  SPACING,
  TEXT_TRANSFORM_UPPERCASE,
  TYPOGRAPHY,
} from '@opentrons/components'
import { useRunCurrentState } from '@opentrons/react-api-client'
import { getLoadedLabwareDefinitionsByUri } from '@opentrons/shared-data'
import type {
  CompletedProtocolAnalysis,
  FlexStackerFillRunTimeCommand,
  ModuleLocation,
} from '@opentrons/shared-data'
import { Divider } from '/app/atoms/structure'
import { css } from 'styled-components'
import { InterventionCommandMessage } from './InterventionCommandMessage'

const LABWARE_DESCRIPTION_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing8};
  padding: ${SPACING.spacing16};
  background-color: ${COLORS.grey20};
  border-radius: ${BORDERS.borderRadius4};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    background-color: ${COLORS.grey35};
    border-radius: ${BORDERS.borderRadius8};
  }
`

const LABWARE_NAME_STYLE = css`
  color: ${COLORS.grey60};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.bodyTextBold}
    color: ${COLORS.black90};
  }
`

const QUANTITY_STYLE = css`
  align-items: ${ALIGN_CENTER};
  color: ${COLORS.grey60};
  background-color: ${COLORS.grey40};
  padding: ${SPACING.spacing4};
  border-radius: ${BORDERS.borderRadius4};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.bodyTextBold}
    grid-gap: ${SPACING.spacing8};
    color: ${COLORS.black90};
  }
`

const DIVIDER_STYLE = css`
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    display: ${DISPLAY_NONE};
  }
`

const LABWARE_DIRECTION_STYLE = css`
  align-items: ${ALIGN_CENTER};
  grid-gap: ${SPACING.spacing4};
  text-transform: ${TEXT_TRANSFORM_UPPERCASE};
  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    grid-gap: ${SPACING.spacing8};
  }
`

const STACKER_IMAGE_STYLE = css`
  flex-direction: ${DIRECTION_COLUMN};
  grid-gap: ${SPACING.spacing8};
  padding: ${SPACING.spacing16};
  background-color: ${COLORS.grey35};
  border-radius: ${BORDERS.lineBorder};
`

function stackerNameFormat(moduleLocation: ModuleLocation): string {
  return 'Stacker ' + moduleLocation.slotName.charAt(0)
}

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
  //const runId = useCurrentRunId()
  const { data: runCurrentState } = useRunCurrentState(run.id)
  const flexStacker =
    runCurrentState?.data.flexStackerStates[command.params.moduleId] ?? null

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
    flexStacker == null
  )
    return null
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
          <Flex css={LABWARE_DESCRIPTION_STYLE}>
            <Flex flexDirection={DIRECTION_COLUMN}>
              <LegacyStyledText as="h2" css={LABWARE_NAME_STYLE}>
                {labwareName}
              </LegacyStyledText>
            </Flex>
            <Flex>
              <LegacyStyledText as="p" css={QUANTITY_STYLE}>
                {'Quantity: ' + labwareCount}
              </LegacyStyledText>
            </Flex>
            <Divider css={DIVIDER_STYLE} />
            <Flex css={LABWARE_DIRECTION_STYLE}>
              <DeckInfoLabel deckLabel={stackerNameFormat(moduleLocation)} />
            </Flex>
          </Flex>
          <InterventionCommandMessage
            commandMessage={command.params.message ?? null}
          />
        </Flex>
        <Flex width="50%" css={STACKER_IMAGE_STYLE}>
          <Box margin="0 auto" width="100%">
            <LegacyStyledText as="p">
              {'Replace me with a Stacker Fill image/animation'}
            </LegacyStyledText>
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}
