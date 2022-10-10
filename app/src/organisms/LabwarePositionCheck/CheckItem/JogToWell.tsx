import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  Box,
  RobotWorkSpace,
  LabwareRender,
  PipetteRender,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SPACING,
  COLORS,
  WELL_LABEL_OPTIONS,
} from '@opentrons/components'
import {
  CompletedProtocolAnalysis,
  getIsTiprack,
  getLabwareDefURI,
  getPipetteNameSpecs,
} from '@opentrons/shared-data'

import levelWithTip from '../../../assets/images/lpc_level_with_tip.svg'
import levelWithLabware from '../../../assets/images/lpc_level_with_labware.svg'
import { PrimaryButton, SecondaryButton } from '../../../atoms/buttons'
import { StyledText } from '../../../atoms/text'
import { getLabwareDefinitionsFromCommands } from '../utils/labware'
import { NeedHelpLink } from '../../CalibrationPanels'
import { JogControls } from '../../../molecules/JogControls'

import type { WellStroke } from '@opentrons/components'
import type { CheckTipRacksStep } from '../types'

const DECK_MAP_VIEWBOX = '-30 -20 170 115'
const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

interface JogToWellProps extends Omit<CheckTipRacksStep, 'section'> {
  runId: string
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  goBack: () => void
}
export const JogToWell = (props: JogToWellProps): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const { pipetteId, labwareId, protocolData, proceed, goBack } = props

  if (protocolData == null) return null
  const labwareDefUri = protocolData.labware.find(l => l.id === labwareId)
    ?.definitionUri
  const labwareDefinitions = getLabwareDefinitionsFromCommands(
    protocolData.commands
  )
  const labwareDef = labwareDefinitions.find(
    def => getLabwareDefURI(def) === labwareDefUri
  )
  if (labwareDef == null) return null
  const pipetteName =
    protocolData.pipettes.find(p => p.id === pipetteId)?.pipetteName ?? null
  if (pipetteName == null) return null
  let wellsToHighlight: string[] = []
  if (getPipetteNameSpecs(pipetteName)?.channels === 8) {
    wellsToHighlight = labwareDef.ordering[0]
  } else {
    wellsToHighlight = ['A1']
  }

  const wellStroke: WellStroke = wellsToHighlight.reduce(
    (acc, wellName) => ({ ...acc, [wellName]: COLORS.blueEnabled }),
    {}
  )

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing6}
      minHeight="25rem"
    >
      <Flex gridGap={SPACING.spacingXXL}>
        <Flex
          flex="1"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing3}
        >
          <StyledText as="h1">TODO HEADER</StyledText>
          <StyledText as="p">TODO BODY TEXT</StyledText>
          <StyledText as="p">TODO LABWARE OFFSET DATA</StyledText>
        </Flex>
        <Flex flex="1">
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
                  pipetteName={pipetteName}
                />
              </React.Fragment>
            )}
          </RobotWorkSpace>
          <Box
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
      </Flex>
      <JogControls />
      <Flex
        width="100%"
        marginTop={SPACING.spacing6}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <NeedHelpLink href={LPC_HELP_LINK_URL} />
        <Flex gridGap={SPACING.spacing3}>
          <SecondaryButton onClick={goBack}>{t('shared:go_back')}</SecondaryButton>
          <PrimaryButton onClick={proceed}>
            {t('shared:confirm_position')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Flex>
  )
}
