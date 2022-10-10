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
  getIsTiprack,
  getLabwareDefURI,
  getPipetteNameSpecs,
  IDENTITY_VECTOR,
} from '@opentrons/shared-data'

import levelWithTip from '../../assets/images/lpc_level_with_tip.svg'
import levelWithLabware from '../../assets/images/lpc_level_with_labware.svg'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { NeedHelpLink } from '../CalibrationPanels'
import { JogControls } from '../../molecules/JogControls'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition2,
} from '@opentrons/shared-data'
import type { WellStroke } from '@opentrons/components'
import type { CheckTipRacksStep } from './types'
import { OffsetVector } from '../../molecules/OffsetVector'

const DECK_MAP_VIEWBOX = '-30 -20 170 115'
const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

interface JogToWellProps extends Omit<CheckTipRacksStep, 'section'> {
  protocolData: CompletedProtocolAnalysis
  proceed: () => void
  goBack: () => void
  labwareDef: LabwareDefinition2
  header: React.ReactNode
  body: React.ReactNode
}
export const JogToWell = (props: JogToWellProps): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const { header, body, pipetteId, labwareDef, protocolData, proceed, goBack } = props

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
          <StyledText as="h1">{header}</StyledText>
          {body}
          <OffsetVector {...IDENTITY_VECTOR}/>
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
