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
  DIRECTION_COLUMN,
  Box,
  JUSTIFY_SPACE_BETWEEN,
  Link,
  ALIGN_START,
  BORDERS,
  ALIGN_CENTER,
  JUSTIFY_SPACE_AROUND,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getIsTiprack,
  getPipetteNameSpecs,
  getVectorDifference,
  getVectorSum,
  IDENTITY_VECTOR,
} from '@opentrons/shared-data'
import {
  HORIZONTAL_PLANE,
  VERTICAL_PLANE,
  DeprecatedJogControls,
  DeprecatedJogControlsProps,
} from '../../../molecules/DeprecatedJogControls'
import { OffsetVector } from '../../../molecules/OffsetVector'
import { useProtocolDetailsForRun } from '../../Devices/hooks'
import { DeprecatedStepDetailText } from './DeprecatedStepDetailText'
import levelWithTip from '../../../assets/images/lpc_level_with_tip.svg'
import levelWithLabware from '../../../assets/images/lpc_level_with_labware.svg'
import type { Jog } from '../../../molecules/DeprecatedJogControls/types'
import type {
  LabwarePositionCheckCreateCommand,
  LabwarePositionCheckMovementCommand,
  DeprecatedLabwarePositionCheckStep,
  SavePositionCommandData,
} from './types'
import { StyledText } from '../../../atoms/text'
import { useLabwareOffsetForLabware } from '../deprecatedHooks/useLabwareOffsetForLabware'
import { useCommandQuery } from '@opentrons/react-api-client'
import type { Coordinates } from '@opentrons/shared-data'

const DECK_MAP_VIEWBOX = '-30 -20 170 115'
interface LabwarePositionCheckStepDetailProps {
  selectedStep: DeprecatedLabwarePositionCheckStep
  jog: Jog
  runId: string
  savePositionCommandData: SavePositionCommandData
}

/**
 *
 * @deprecated
 */
export const DeprecatedLabwarePositionCheckStepDetail = (
  props: LabwarePositionCheckStepDetailProps
): JSX.Element | null => {
  const { selectedStep, runId, savePositionCommandData } = props
  const { t } = useTranslation('labware_position_check')
  const { protocolData } = useProtocolDetailsForRun(runId)
  const [showJogControls, setShowJogControls] = React.useState<boolean>(false)
  const { labwareId } = selectedStep
  const existingOffset = useLabwareOffsetForLabware(runId, labwareId)
  const [
    livePositionDeckCoords,
    setLivePositionDeckCoords,
  ] = React.useState<Coordinates | null>(null)

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
  const labwareDefUri =
    protocolData.labware.find(item => item.id === labwareId)?.definitionUri ??
    ''
  const labwareDef = protocolData.labwareDefinitions[labwareDefUri]
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

  const pipetteId = command.params.pipetteId
  const pipetteName = protocolData.pipettes.find(
    pipette => pipette.id === pipetteId
  )?.pipetteName
  let wellsToHighlight: string[] = []

  // @ts-expect-error pipetteName will not be undefined
  const pipetteChannels = getPipetteNameSpecs(pipetteName)?.channels
  if (pipetteChannels === 8) {
    wellsToHighlight = labwareDef.ordering[0]
  } else {
    wellsToHighlight = ['A1']
  }

  const wellStroke: WellStroke = wellsToHighlight.reduce(
    (acc, wellName) => ({
      ...acc,
      [wellName]: COLORS.blueEnabled,
    }),
    {}
  )

  const handleJog: DeprecatedJogControlsProps['jog'] = (
    axis,
    direction,
    step
  ) => {
    const onSuccess = (position: Coordinates | null): void => {
      setLivePositionDeckCoords(position)
    }
    props.jog(axis, direction, step, onSuccess)
  }

  const joggedVector =
    initialPosition != null && livePositionDeckCoords != null
      ? getVectorDifference(livePositionDeckCoords, initialPosition)
      : IDENTITY_VECTOR
  const liveOffset =
    existingOffset != null
      ? getVectorSum(existingOffset.vector, joggedVector)
      : joggedVector

  return (
    <Flex
      padding="0.75rem"
      justifyContent={JUSTIFY_CENTER}
      boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
      borderRadius="4px"
      backgroundColor={COLORS.fundamentalsBackground}
      flexDirection={DIRECTION_COLUMN}
      width="106%"
    >
      <DeprecatedStepDetailText
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
            <React.Fragment>
              <LabwareRender
                definition={labwareDef}
                wellStroke={wellStroke}
                wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_OUTSIDE}
                highlightedWellLabels={{ wells: wellsToHighlight }}
                labwareStroke={COLORS.medGreyEnabled}
                wellLabelColor={COLORS.medGreyEnabled}
              />
              <PipetteRender
                labwareDef={labwareDef}
                // @ts-expect-error pipetteName will not be undefined
                pipetteName={pipetteName}
              />
            </React.Fragment>
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
      <Flex
        backgroundColor={COLORS.white}
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing3}
      >
        <Flex justifyContent={JUSTIFY_SPACE_AROUND} alignItems={ALIGN_CENTER}>
          <Flex
            backgroundColor={COLORS.fundamentalsBackground}
            flexDirection={DIRECTION_COLUMN}
            borderRadius={BORDERS.radiusSoftCorners}
            padding={SPACING.spacing3}
            color={COLORS.darkGreyEnabled}
          >
            <StyledText as="h6">{t('labware_offset')}</StyledText>
            <OffsetVector
              {...liveOffset}
              data-testid="LabwarePositionCheckStepDetail_liveOffset"
            />
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} paddingLeft={SPACING.spacing4}>
            <StyledText as="p">{t('jog_controls_adjustment')}</StyledText>
            {!showJogControls ? (
              <Link
                role="button"
                fontSize={TYPOGRAPHY.fontSizeH3}
                color={COLORS.blueEnabled}
                onClick={() => setShowJogControls(true)}
                id="LabwarePositionCheckStepDetail_reveal_jog_controls"
              >
                {t('reveal_jog_controls')}
              </Link>
            ) : null}
          </Flex>
        </Flex>
        {showJogControls ? (
          <DeprecatedJogControls
            marginTop={SPACING.spacing3}
            jog={handleJog}
            stepSizes={[0.1, 1, 10]}
            planes={[HORIZONTAL_PLANE, VERTICAL_PLANE]}
            width="100%"
            directionControlButtonColor={COLORS.blueEnabled}
          />
        ) : null}
      </Flex>
    </Flex>
  )
}
