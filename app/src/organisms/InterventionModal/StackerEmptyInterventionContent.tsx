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
  FlexStackerEmptyRunTimeCommand,
  ModuleLocation,
  RobotType,
} from '@opentrons/shared-data'
import { Divider } from '/app/atoms/structure'
import { useNotifyDeckConfigurationQuery } from '/app/resources/deck_configuration'
import { useTranslation } from 'react-i18next'
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

  //const runId = useCurrentRunId()
  const { data: runCurrentState } = useRunCurrentState(run.id)
  //const runCurrentState = useRunCurrentState(run.id)?.data ?? null
  const flexStacker =
    runCurrentState?.data.flexStackerStates[command.params.moduleId] ?? null

  const analysisCommands = analysis?.commands ?? []
  const labwareDefsByUri = getLoadedLabwareDefinitionsByUri(analysisCommands)
  const deckConfig = useNotifyDeckConfigurationQuery().data ?? []

  // Get the name of the labware to be removed from the stacker
  let labwareName: string | null = null
  if (flexStacker) {
    const labwareDef = labwareDefsByUri?.[flexStacker.primaryLabwareURI] ?? null
    labwareName = labwareDef?.metadata.displayName ?? null
  }

  // Get the location of the module in question
  // do this by serial number insread
  console.log(
    'modules len:' +
      analysis?.modules.length +
      ' analysis: ' +
      analysis?.modules[0].model +
      ' zero id:' +
      analysis?.modules[0].id +
      ' command ID:' +
      command.params.moduleId
  )

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
              {'Replace me with a Stacker Empty image/animation'}
            </LegacyStyledText>
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
}
