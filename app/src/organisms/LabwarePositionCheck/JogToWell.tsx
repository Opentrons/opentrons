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
  getVectorDifference,
  getVectorSum,
  IDENTITY_VECTOR,
  PipetteName,
} from '@opentrons/shared-data'

import levelWithTip from '../../assets/images/lpc_level_with_tip.svg'
import levelWithLabware from '../../assets/images/lpc_level_with_labware.svg'
import { PrimaryButton, SecondaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { NeedHelpLink } from '../CalibrationPanels'
import { JogControls } from '../../molecules/JogControls'
import { LiveOffsetValue } from './LiveOffsetValue'

import type { Jog } from '../../molecules/JogControls'
import type { LabwareDefinition2, Coordinates} from '@opentrons/shared-data'
import type { WellStroke } from '@opentrons/components'
import type { VectorOffset } from '@opentrons/api-client'

const DECK_MAP_VIEWBOX = '-30 -20 170 115'
const LPC_HELP_LINK_URL =
  'https://support.opentrons.com/s/article/How-Labware-Offsets-work-on-the-OT-2'

interface JogToWellProps {
  handleConfirmPosition: () => void
  handleGoBack: () => void
  handleJog: Jog
  pipetteName: PipetteName
  labwareDef: LabwareDefinition2
  header: React.ReactNode
  body: React.ReactNode
  initialPosition: VectorOffset 
  existingOffset: VectorOffset 
}
export const JogToWell = (props: JogToWellProps): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const { header, body, pipetteName, labwareDef, handleConfirmPosition, handleGoBack, handleJog, initialPosition, existingOffset } = props

  const [joggedPosition, setJoggedPosition] = React.useState<VectorOffset>(initialPosition)

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

  const liveOffset = getVectorSum(existingOffset, getVectorDifference(joggedPosition, initialPosition))

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
          <LiveOffsetValue {...liveOffset} />
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
      <JogControls jog={(axis, direction, step, _onSuccess) => handleJog(axis, direction, step, setJoggedPosition)} />
      <Flex
        width="100%"
        marginTop={SPACING.spacing6}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        alignItems={ALIGN_CENTER}
      >
        <NeedHelpLink href={LPC_HELP_LINK_URL} />
        <Flex gridGap={SPACING.spacing3}>
          <SecondaryButton onClick={handleGoBack}>{t('shared:go_back')}</SecondaryButton>
          <PrimaryButton onClick={handleConfirmPosition}>
            {t('shared:confirm_position')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Flex>
  )
}
