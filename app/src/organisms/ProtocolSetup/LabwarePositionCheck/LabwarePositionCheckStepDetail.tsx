import * as React from 'react'
import {
  C_NEAR_WHITE,
  FONT_SIZE_CAPTION,
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
} from '@opentrons/components'
import { getPipetteNameSpecs } from '@opentrons/shared-data'
import { useProtocolDetails } from '../../RunDetails/hooks'
import { StepDetailText } from './StepDetailText'
import levelWithTip from '../../../assets/images/lpc_level_with_tip.svg'
import levelWithLabware from '../../../assets/images/lpc_level_with_labware.svg'
import type { LabwarePositionCheckStep } from './types'

const DECK_MAP_VIEWBOX = '-30 -80 180 190'
interface LabwarePositionCheckStepDetailProps {
  selectedStep: LabwarePositionCheckStep
}
export const LabwarePositionCheckStepDetail = (
  props: LabwarePositionCheckStepDetailProps
): JSX.Element | null => {
  const { selectedStep } = props
  const { labwareId } = selectedStep

  const { protocolData } = useProtocolDetails()

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

  return (
    <Flex
      fontSize={FONT_SIZE_CAPTION}
      padding={SPACING_2}
      width="60%"
      justifyContent={JUSTIFY_CENTER}
      marginTop={SPACING_4}
      marginLeft="30%"
      boxShadow="1px 1px 1px rgba(0, 0, 0, 0.25)"
      borderRadius="4px"
      backgroundColor={C_NEAR_WHITE}
      flexDirection={'column'}
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
        <Box width="40%" padding={SPACING_2} marginBottom={'7rem'}>
          {labwareDefId.includes('tiprack') ? (
            <img src={levelWithTip} />
          ) : (
            <img src={levelWithLabware} />
          )}
        </Box>
      </Flex>
    </Flex>
  )
}
