import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import styled, { css } from 'styled-components'
import {
  Flex,
  RobotWorkSpace,
  LabwareRender,
  PipetteRender,
  JUSTIFY_SPACE_BETWEEN,
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  SPACING,
  COLORS,
  WELL_LABEL_OPTIONS,
  ALIGN_FLEX_START,
  PrimaryButton,
  SecondaryButton,
  TYPOGRAPHY,
  RESPONSIVENESS,
} from '@opentrons/components'
import {
  getIsTiprack,
  getPipetteNameSpecs,
  getVectorDifference,
  getVectorSum,
  PipetteName,
} from '@opentrons/shared-data'

import levelWithTip from '../../assets/images/lpc_level_with_tip.svg'
import levelWithLabware from '../../assets/images/lpc_level_with_labware.svg'
import levelProbeWithTip from '../../assets/images/lpc_level_probe_with_tip.svg'
import levelProbeWithLabware from '../../assets/images/lpc_level_probe_with_labware.svg'
import { getIsOnDevice } from '../../redux/config'
import { Portal } from '../../App/portal'
import { LegacyModalShell } from '../../molecules/LegacyModal'
import { StyledText } from '../../atoms/text'
import { SmallButton } from '../../atoms/buttons'
import { NeedHelpLink } from '../CalibrationPanels'
import { JogControls } from '../../molecules/JogControls'
import { LiveOffsetValue } from './LiveOffsetValue'

import type { Jog } from '../../molecules/JogControls'
import type { LabwareDefinition2 } from '@opentrons/shared-data'
import type { WellStroke } from '@opentrons/components'
import type { VectorOffset } from '@opentrons/api-client'

const DECK_MAP_VIEWBOX = '-10 -10 150 105'
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
  shouldUseMetalProbe: boolean
}
export const JogToWell = (props: JogToWellProps): JSX.Element | null => {
  const { t } = useTranslation(['labware_position_check', 'shared'])
  const {
    header,
    body,
    pipetteName,
    labwareDef,
    handleConfirmPosition,
    handleGoBack,
    handleJog,
    initialPosition,
    existingOffset,
    shouldUseMetalProbe,
  } = props

  const [joggedPosition, setJoggedPosition] = React.useState<VectorOffset>(
    initialPosition
  )
  const isOnDevice = useSelector(getIsOnDevice)
  const [showFullJogControls, setShowFullJogControls] = React.useState(false)
  React.useEffect(() => {
    //  NOTE: this will perform a "null" jog when the jog controls mount so
    //  if a user reaches the "confirm exit" modal (unmounting this component)
    //  and clicks "go back" we are able so initialize the live offset to whatever
    //  distance they had already jogged before clicking exit.
    // the `mounted` variable prevents a possible memory leak (see https://legacy.reactjs.org/docs/hooks-effect.html#example-using-hooks-1)
    let mounted = true
    if (mounted) {
      handleJog('x', 1, 0, setJoggedPosition)
    }
    return () => {
      mounted = false
    }
  }, [])

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

  const liveOffset = getVectorSum(
    existingOffset,
    getVectorDifference(joggedPosition, initialPosition)
  )
  const isTipRack = getIsTiprack(labwareDef)
  let levelSrc = isTipRack ? levelWithTip : levelWithLabware
  if (shouldUseMetalProbe) {
    levelSrc = isTipRack ? levelProbeWithTip : levelProbeWithLabware
  }
  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      padding={SPACING.spacing32}
      minHeight="29.5rem"
    >
      <Flex gridGap={SPACING.spacing24}>
        <Flex
          flex="1"
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing8}
          alignItems={ALIGN_FLEX_START}
        >
          <Header>{header}</Header>
          {body}
          <LiveOffsetValue {...liveOffset} />
        </Flex>
        <Flex flex="1" alignItems={ALIGN_CENTER} gridGap={SPACING.spacing20}>
          <RobotWorkSpace viewBox={DECK_MAP_VIEWBOX}>
            {() => (
              <>
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
              </>
            )}
          </RobotWorkSpace>
          <img
            width="89px"
            height="145px"
            src={levelSrc}
            alt={`level with ${isTipRack ? 'tip' : 'labware'}`}
          />
        </Flex>
      </Flex>
      {isOnDevice ? (
        <Flex
          width="100%"
          marginTop={SPACING.spacing32}
          justifyContent={JUSTIFY_SPACE_BETWEEN}
          alignItems={ALIGN_CENTER}
        >
          <SmallButton
            buttonType="tertiaryLowLight"
            buttonText={t('shared:go_back')}
            onClick={handleGoBack}
          />
          <Flex gridGap={SPACING.spacing8} alignItems={ALIGN_CENTER}>
            <SmallButton
              buttonType="secondary"
              buttonText={t('move_pipette')}
              onClick={() => {
                setShowFullJogControls(true)
              }}
            />
            <SmallButton
              buttonText={t('shared:confirm_position')}
              onClick={handleConfirmPosition}
            />
          </Flex>
          <Portal level="top">
            {showFullJogControls ? (
              <LegacyModalShell
                width="60rem"
                height="33.5rem"
                padding={SPACING.spacing32}
                display="flex"
                flexDirection={DIRECTION_COLUMN}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                header={
                  <StyledText
                    as="h4"
                    css={css`
                      font-weight: ${TYPOGRAPHY.fontWeightBold};
                      font-size: ${TYPOGRAPHY.fontSize28};
                      line-height: ${TYPOGRAPHY.lineHeight36};
                    `}
                  >
                    {t('move_to_a1_position')}
                  </StyledText>
                }
                footer={
                  <SmallButton
                    width="100%"
                    textTransform={TYPOGRAPHY.textTransformCapitalize}
                    buttonText={t('shared:close')}
                    onClick={() => {
                      setShowFullJogControls(false)
                    }}
                  />
                }
              >
                <JogControls
                  jog={(axis, direction, step, _onSuccess) =>
                    handleJog(axis, direction, step, setJoggedPosition)
                  }
                  isOnDevice={true}
                />
              </LegacyModalShell>
            ) : null}
          </Portal>
        </Flex>
      ) : (
        <>
          <JogControls
            jog={(axis, direction, step, _onSuccess) =>
              handleJog(axis, direction, step, setJoggedPosition)
            }
          />
          <Flex
            width="100%"
            marginTop={SPACING.spacing32}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
            alignItems={ALIGN_CENTER}
          >
            <NeedHelpLink href={LPC_HELP_LINK_URL} />
            <Flex gridGap={SPACING.spacing8}>
              <SecondaryButton onClick={handleGoBack}>
                {t('shared:go_back')}
              </SecondaryButton>
              <PrimaryButton onClick={handleConfirmPosition}>
                {t('shared:confirm_position')}
              </PrimaryButton>
            </Flex>
          </Flex>
        </>
      )}
    </Flex>
  )
}

const Header = styled.h1`
  ${TYPOGRAPHY.h1Default}

  @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
    ${TYPOGRAPHY.level4HeaderSemiBold}
  }
`
