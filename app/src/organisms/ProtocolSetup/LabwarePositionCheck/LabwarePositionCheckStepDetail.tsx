import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  C_NEAR_WHITE,
  SPACING_2,
  JUSTIFY_CENTER,
  SPACING_4,
  Flex,
  RobotWorkSpace,
  LabwareRender,
  PipetteRender,
  WellStroke,
  WELL_LABEL_OPTIONS,
  C_BLUE,
  C_MED_GRAY,
  DIRECTION_ROW,
  ALIGN_CENTER,
  Box,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  SPACING_6,
  FONT_SIZE_BODY_2,
  Link,
} from '@opentrons/components'
import { getIsTiprack, getPipetteNameSpecs } from '@opentrons/shared-data'
import {
  HORIZONTAL_PLANE,
  JogControls,
  VERTICAL_PLANE,
} from '../../../molecules/JogControls'
import { useProtocolDetails } from '../../RunDetails/hooks'
import { StepDetailText } from './StepDetailText'
import levelWithTip from '../../../assets/images/lpc_level_with_tip.svg'
import levelWithLabware from '../../../assets/images/lpc_level_with_labware.svg'
import { Axis, Sign, StepSize } from '../../../molecules/JogControls/types'
import type { LabwarePositionCheckStep } from './types'

const DECK_MAP_VIEWBOX = '-30 -90 180 190'
interface LabwarePositionCheckStepDetailProps {
  selectedStep: LabwarePositionCheckStep
}
export const LabwarePositionCheckStepDetail = (
  props: LabwarePositionCheckStepDetailProps
): JSX.Element | null => {
  const { selectedStep } = props
  const { t } = useTranslation('labware_position_check')
  const { protocolData } = useProtocolDetails()
  const [showJogControls, setShowJogControls] = React.useState<boolean>(false)
  const { labwareId } = selectedStep
  if (protocolData == null) return null
  const labwareDefId = protocolData.labware[labwareId].definitionId
  const labwareDef = protocolData.labwareDefinitions[labwareDefId]
  const command = selectedStep.commands[0]
  // there case should never happen, there will always be a pipette id in the LPC commands list
  if (!('pipette' in command.params)) {
    console.error(
      `expected there to be a pipette in LPC command ${command.command}, but there was none`
    )
    return null
  }
  const pipetteId = command.params.pipette
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
      [wellName]: C_BLUE,
    }),
    {}
  )
  const jog = (axis: Axis, dir: Sign, step: StepSize): void => {
    console.log(axis, dir, step) // TODO Immediately: wire this up to robot api call
  }

  return (
    <React.Fragment>
      <Flex
        padding={'0.75rem'}
        justifyContent={JUSTIFY_CENTER}
        marginTop={SPACING_4}
        boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
        borderRadius="4px"
        backgroundColor={C_NEAR_WHITE}
        flexDirection={DIRECTION_COLUMN}
        width="100%"
      >
        <StepDetailText
          selectedStep={props.selectedStep}
          pipetteChannels={pipetteChannels}
        />
        <Flex
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
        >
          <RobotWorkSpace viewBox={DECK_MAP_VIEWBOX}>
            {() => (
              <React.Fragment>
                <LabwareRender
                  definition={labwareDef}
                  wellStroke={wellStroke}
                  wellLabelOption={WELL_LABEL_OPTIONS.SHOW_LABEL_OUTSIDE}
                  highlightedWellLabels={{ wells: wellsToHighlight }}
                  labwareStroke={C_MED_GRAY}
                  wellLabelColor={C_MED_GRAY}
                />
                <PipetteRender
                  labwareDef={labwareDef}
                  pipetteName={pipetteName}
                />
              </React.Fragment>
            )}
          </RobotWorkSpace>
          <Box width="40%" padding={SPACING_2} marginBottom={SPACING_6}>
            {getIsTiprack(labwareDef) ? (
              <img src={levelWithTip} alt="level with tip" />
            ) : (
              <img src={levelWithLabware} alt="level with labware" />
            )}
          </Box>
        </Flex>
        <Box fontSize={FONT_SIZE_BODY_2} padding={SPACING_2}>
          <Flex justifyContent={JUSTIFY_CENTER} marginTop={'-10rem'}>
            {t('jog_controls_adjustment')}
          </Flex>
        </Box>
        {showJogControls ? (
          <Flex marginTop={'-10rem'} zIndex={5} justifyContent={JUSTIFY_CENTER}>
            <JogControls
              jog={jog}
              stepSizes={[0.1, 1, 10]}
              planes={[HORIZONTAL_PLANE, VERTICAL_PLANE]}
              width="100%"
            />
          </Flex>
        ) : (
          <Box fontSize={FONT_SIZE_BODY_2} padding={SPACING_2}>
            <Flex justifyContent={JUSTIFY_CENTER} marginTop={'-8rem'}>
              <Link
                role={'link'}
                fontSize={FONT_SIZE_BODY_2}
                color={C_BLUE}
                onClick={() => setShowJogControls(true)}
                zIndex={2}
              >
                {t('reveal_jog_controls')}
              </Link>
            </Flex>
          </Box>
        )}
      </Flex>
    </React.Fragment>
  )
}
