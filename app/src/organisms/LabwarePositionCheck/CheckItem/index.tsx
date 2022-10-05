import * as React from 'react'
import uniq from 'lodash/uniq'
import isEqual from 'lodash/isEqual'
import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  NewPrimaryBtn,
  ALIGN_FLEX_START,
  SPACING,
  TYPOGRAPHY,
  COLORS,
  WellStroke,
} from '@opentrons/components'
import { useCreateCommandMutation } from '@opentrons/react-api-client'
import type {
  Axis,
  Jog,
  Sign,
  StepSize,
} from '../../molecules/JogControls/types'
import { StyledText } from '../../atoms/text'
import { LabwarePositionCheckStepDetail } from './LabwarePositionCheckStepDetail'
import { SectionList } from './SectionList'
import { useIntroInfo, useLabwareIdsBySection, useDeprecatedSteps } from './hooks'
import { DeckMap } from './DeckMap'
import type { LabwarePositionCheckStep, SavePositionCommandData } from './types'
import { CompletedProtocolAnalysis, Coordinates, getPipetteNameSpecs, getVectorDifference, getVectorSum, IDENTITY_VECTOR } from '@opentrons/shared-data'
import { useLabwareOffsetForLabware } from './hooks/useLabwareOffsetForLabware'
import { PrimaryButton } from '../../atoms/buttons'
import { JogControls } from '../../molecules/JogControls'
import { OffsetVector } from '../../molecules/OffsetVector'

const JOG_COMMAND_TIMEOUT = 10000 // 10 seconds

interface CheckItemProps {
  runId: string
  pipetteId: string
  labwareId: string
  proceed: () => void
  protocolData: CompletedProtocolAnalysis
}
export const CheckItem = (
  props: CheckItemProps
): JSX.Element | null => {
  const { runId, pipetteId, labwareId, proceed, protocolData } = props
  const { createCommand } = useCreateCommandMutation()
  const [
    livePositionDeckCoords,
    setLivePositionDeckCoords,
  ] = React.useState<Coordinates | null>(null)
  const jog = (
    axis: Axis,
    dir: Sign,
    step: StepSize,
  ): void => {
    createCommand({
      runId,
      command: {
        commandType: 'moveRelative',
        params: { pipetteId, distance: step * dir, axis },
      },
      waitUntilComplete: true,
      timeout: JOG_COMMAND_TIMEOUT,
    })
      .then(data => {
        console.log(data?.data?.result?.position ?? null)
        setLivePositionDeckCoords(data?.data?.result?.position ?? null)
      })
      .catch((e: Error) => {
        console.error(`error issuing jog command: ${e.message}`)
      })
  }


  const existingOffset = useLabwareOffsetForLabware(runId, labwareId)

  const initialSavePositionCommandId = (savePositionCommandData[labwareId] ??
    [])[0]
  const initialSavePositionCommand = useCommandQuery(
    runId,
    initialSavePositionCommandId
  )?.data?.data
  const initialPosition =
    initialSavePositionCommand?.commandType === 'savePosition'
      ? initialSavePositionCommand.result.position
      : null

  if (protocolData == null) return null
  const labwareDefId = protocolData.labware[labwareId].definitionId
  const labwareDef = protocolData.labwareDefinitions[labwareDefId]
  // filter out the TC open lid command as it does not have an associated pipette id
  const stepMovementCommands = selectedStep.commands.filter(
    (
      command: LabwarePositionCheckCreateCommand
    ): command is LabwarePositionCheckMovementCommand =>
      command.commandType !== 'thermocycler/openLid' &&
      command.commandType !== 'heaterShaker/deactivateShaker' &&
      command.commandType !== 'heaterShaker/closeLabwareLatch'
  )
  const command = stepMovementCommands[0]

  const pipetteName = protocolData.pipettes.find(p => p.id === pipetteId)?.pipetteName
  let wellsToHighlight: string[] = []
  const pipetteChannels = pipetteName != null ? getPipetteNameSpecs(pipetteName)?.channels : 1
  if (pipetteChannels === 8) {
    wellsToHighlight = labwareDef.ordering[0]
  } else {
    wellsToHighlight = ['A1']
  }

  const wellStroke: WellStroke = wellsToHighlight.reduce(
    (acc, wellName) => ({ ...acc, [wellName]: COLORS.blueEnabled }),
    {}
  )

  const joggedVector =
    initialPosition != null && livePositionDeckCoords != null
      ? getVectorDifference(livePositionDeckCoords, initialPosition)
      : IDENTITY_VECTOR 
  const liveOffset =
    existingOffset != null
      ? getVectorSum(existingOffset.vector, joggedVector)
      : joggedVector


  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      <StyledText
        as="h3"
        textTransform={TYPOGRAPHY.textTransformUppercase}
        fontWeight={TYPOGRAPHY.fontWeightSemiBold}
      >
        CHECK ITEM
      </StyledText>
      <Flex alignItems={ALIGN_FLEX_START} marginTop={SPACING.spacing4}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <DeckMap />
        </Flex>
        <OffsetVector {...liveOffset} />
        <Flex marginLeft={SPACING.spacing7}>
          <JogControls jog={jog} />
        </Flex>
      </Flex>
      <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING.spacing4}>
        <PrimaryButton onClick={props.proceed}>CONFIRM POSITION</PrimaryButton>
      </Flex>
    </Flex>
  )
}
