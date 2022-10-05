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
import { CompletedProtocolAnalysis, Coordinates, getLabwareDefURI, getPipetteNameSpecs, getVectorDifference, getVectorSum, IDENTITY_VECTOR } from '@opentrons/shared-data'
import { useLabwareOffsetForLabware } from './hooks/useLabwareOffsetForLabware'
import { PrimaryButton } from '../../atoms/buttons'
import { JogControls } from '../../molecules/JogControls'
import { OffsetVector } from '../../molecules/OffsetVector'

const JOG_COMMAND_TIMEOUT = 10000 // 10 seconds

interface CheckItemProps {
  runId: string
  pipetteId: string
  labwareId: string
  protocolData: CompletedProtocolAnalysis
}
export const CheckItem = (
  props: CheckItemProps
): JSX.Element | null => {
  const { runId, pipetteId, labwareId, protocolData } = props
  const { createCommand } = useCreateCommandMutation()

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
  const labwareDefUri = protocolData.labware.find(l => l.id === labwareId)?.definitionUri
  const labwareDef = protocolData.labwareDefinitions.find(def => getLabwareDefURI(def) === labwareDefUri)

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
