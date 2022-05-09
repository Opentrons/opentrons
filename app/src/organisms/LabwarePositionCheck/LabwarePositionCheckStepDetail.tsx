import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  SPACING,
  JUSTIFY_CENTER,
  Flex,
  RobotWorkSpace,
  LabwareRender,
  PipetteRender,
  WellStroke,
  WELL_LABEL_OPTIONS,
  DIRECTION_ROW,
  Box,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  FONT_SIZE_BODY_2,
  Link,
  ALIGN_START,
  ALIGN_CENTER,
} from '@opentrons/components'
import { getIsTiprack, getPipetteNameSpecs, IDENTITY_VECTOR } from '@opentrons/shared-data'
import {
  HORIZONTAL_PLANE,
  JogControls,
  VERTICAL_PLANE,
} from '../../molecules/JogControls'
import { StyledText } from '../../atoms/text'
import { OffsetVector } from '../../molecules/OffsetVector'
import { useProtocolDetailsForRun } from '../Devices/hooks'
import { StepDetailText } from './StepDetailText'
import levelWithTip from '../../assets/images/lpc_level_with_tip.svg'
import levelWithLabware from '../../assets/images/lpc_level_with_labware.svg'

import type { Jog } from '../../molecules/JogControls/types'
import type {
  LabwarePositionCheckCreateCommand,
  LabwarePositionCheckMovementCommand,
  LabwarePositionCheckStep,
} from './types'
import { useLabwareOffsetForLabware } from './hooks/useLabwareOffsetForLabware'

const DECK_MAP_VIEWBOX = '-30 -20 170 115'
interface LabwarePositionCheckStepDetailProps {
  selectedStep: LabwarePositionCheckStep
  jog: Jog
  runId: string
}
export const LabwarePositionCheckStepDetail = (
  props: LabwarePositionCheckStepDetailProps
): JSX.Element | null => {
  const { selectedStep, runId } = props
  const { t } = useTranslation('labware_position_check')
  const { protocolData } = useProtocolDetailsForRun(runId)
  const [showJogControls, setShowJogControls] = React.useState<boolean>(false)
  const { labwareId } = selectedStep
  const initialOffset = useLabwareOffsetForLabware(runId, labwareId)
  if (protocolData == null) return null
  const labwareDefId = protocolData.labware[labwareId].definitionId
  const labwareDef = protocolData.labwareDefinitions[labwareDefId]
  // filter out the TC open lid command as it does not have an associated pipette id
  const stepMovementCommands = selectedStep.commands.filter(
    (
      command: LabwarePositionCheckCreateCommand
    ): command is LabwarePositionCheckMovementCommand =>
      command.commandType !== 'thermocycler/openLid'
  )
  const command = stepMovementCommands[0]

  const pipetteId = command.params.pipetteId
  const pipetteName = protocolData.pipettes[pipetteId].name
  let wellsToHighlight: string[] = []
  const pipetteChannels = getPipetteNameSpecs(pipetteName)?.channels
  if (pipetteChannels === 8) {
    wellsToHighlight = labwareDef.ordering[0]
  } else {
    wellsToHighlight = ['A1']
  }

  const wellStroke: WellStroke = wellsToHighlight.reduce(
    (acc, wellName) => ({
      ...acc,
      [wellName]: COLORS.blue,
    }),
    {}
  )

  return (
    <Flex
      padding={SPACING.spacing3}
      justifyContent={JUSTIFY_CENTER}
      boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
      borderRadius="4px"
      backgroundColor={COLORS.background}
      flexDirection={DIRECTION_COLUMN}
      width="106%"
    >
      <StepDetailText
        selectedStep={props.selectedStep}
        pipetteChannels={pipetteChannels}
        runId={runId}
      />
      <Flex
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_START}
      >
        <RobotWorkSpace viewBox={DECK_MAP_VIEWBOX}>
          {() => (
            <>
              <LabwareRender
                definition={labwareDef}
                wellStroke={wellStroke}
                wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_OUTSIDE}
                highlightedWellLabels={{ wells: wellsToHighlight }}
                labwareStroke={COLORS.medGrey}
                wellLabelColor={COLORS.medGrey}
              />
              <PipetteRender
                labwareDef={labwareDef}
                pipetteName={pipetteName}
              />
            </>
          )}
        </RobotWorkSpace>
        <Box
          width="40%"
          padding={SPACING.spacing3}
          marginTop={SPACING.spacing4}
        >
          {getIsTiprack(labwareDef) ? (
            <img src={levelWithTip} alt="level with tip" />
          ) : (
            <img src={levelWithLabware} alt="level with labware" />
          )}
        </Box>
      </Flex>

      <Flex flexDirection={DIRECTION_COLUMN} backgroundColor={COLORS.white}>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN} alignItems={ALIGN_CENTER}>
          <Flex backgroundColor={COLORS.background}>
            <StyledText as="h6">{t('labware_offset')}</StyledText>
            <OffsetVector {...(initialOffset?.vector ?? IDENTITY_VECTOR)} />
          </Flex>
          <StyledText as="p">{t('jog_controls_adjustment')}</StyledText>
          {!showJogControls ? (
            <Flex justifyContent={JUSTIFY_CENTER} marginTop={SPACING.spacing3}>
              <Link
                role={'link'}
                fontSize={FONT_SIZE_BODY_2}
                color={COLORS.blue}
                onClick={() => setShowJogControls(true)}
                id={`LabwarePositionCheckStepDetail_reveal_jog_controls`}
              >
                {t('reveal_jog_controls')}
              </Link>
            </Flex>
          ) : null}
        </Flex>
        {showJogControls ? (
          <JogControls
            jog={props.jog}
            stepSizes={[0.1, 1, 10]}
            planes={[HORIZONTAL_PLANE, VERTICAL_PLANE]}
            width="100%"
            directionControlButtonColor={COLORS.blue}
            isLPC={true}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
