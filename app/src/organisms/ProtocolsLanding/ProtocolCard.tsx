import * as React from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'

import {
  getModuleType,
  getPipetteNameSpecs,
  ProtocolAnalysisOutput,
  FLEX_STANDARD_MODEL,
  getGripperDisplayName,
} from '@opentrons/shared-data'
import {
  Box,
  Flex,
  Icon,
  ModuleIcon,
  ALIGN_FLEX_START,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  POSITION_ABSOLUTE,
  SIZE_2,
  SIZE_3,
  SPACING,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'

import {
  parseInitialPipetteNamesByMount,
  parseAllRequiredModuleModels,
} from '@opentrons/api-client'

import { getIsProtocolAnalysisInProgress } from '../../redux/protocol-storage'
import { InstrumentContainer } from '../../atoms/InstrumentContainer'
import { StyledText } from '../../atoms/text'
import { DeckThumbnail } from '../../molecules/DeckThumbnail'
import { ProtocolOverflowMenu } from './ProtocolOverflowMenu'
import { ProtocolAnalysisFailure } from '../ProtocolAnalysisFailure'
import {
  getAnalysisStatus,
  getProtocolDisplayName,
  getRobotTypeDisplayName,
} from './utils'

import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { State } from '../../redux/types'
import { getProtocolUsesGripper } from '../ProtocolSetupInstruments/utils'

interface ProtocolCardProps {
  handleRunProtocol: (storedProtocolData: StoredProtocolData) => void
  handleSendProtocolToOT3: (storedProtocolData: StoredProtocolData) => void
  storedProtocolData: StoredProtocolData
}

export function ProtocolCard(props: ProtocolCardProps): JSX.Element | null {
  const history = useHistory()
  const {
    handleRunProtocol,
    handleSendProtocolToOT3,
    storedProtocolData,
  } = props
  const {
    protocolKey,
    srcFileNames,
    mostRecentAnalysis,
    modified,
  } = storedProtocolData
  const isAnalyzing = useSelector((state: State) =>
    getIsProtocolAnalysisInProgress(state, protocolKey)
  )
  const protocolDisplayName = getProtocolDisplayName(
    protocolKey,
    srcFileNames,
    mostRecentAnalysis
  )

  return (
    <Box
      backgroundColor={COLORS.white}
      borderRadius={BORDERS.radiusSoftCorners}
      cursor="pointer"
      minWidth="36rem"
      padding={SPACING.spacing16}
      position="relative"
      onClick={() => history.push(`/protocols/${protocolKey}`)}
      css={BORDERS.cardOutlineBorder}
    >
      <AnalysisInfo
        protocolKey={protocolKey}
        mostRecentAnalysis={mostRecentAnalysis}
        protocolDisplayName={protocolDisplayName}
        isAnalyzing={isAnalyzing}
        modified={modified}
      />
      <Box
        position={POSITION_ABSOLUTE}
        top={SPACING.spacing4}
        right={SPACING.spacing4}
      >
        <ProtocolOverflowMenu
          handleRunProtocol={handleRunProtocol}
          handleSendProtocolToOT3={handleSendProtocolToOT3}
          storedProtocolData={storedProtocolData}
        />
      </Box>
    </Box>
  )
}

interface AnalysisInfoProps {
  protocolKey: string
  protocolDisplayName: string
  modified: number
  isAnalyzing: boolean
  mostRecentAnalysis?: ProtocolAnalysisOutput | null
}
function AnalysisInfo(props: AnalysisInfoProps): JSX.Element {
  const {
    protocolKey,
    protocolDisplayName,
    isAnalyzing,
    mostRecentAnalysis,
    modified,
  } = props
  const { t } = useTranslation(['protocol_list', 'shared'])
  const analysisStatus = getAnalysisStatus(isAnalyzing, mostRecentAnalysis)

  const { left: leftMountPipetteName, right: rightMountPipetteName } =
    mostRecentAnalysis != null
      ? parseInitialPipetteNamesByMount(mostRecentAnalysis.commands)
      : { left: null, right: null }
  const requiredModuleModels = parseAllRequiredModuleModels(
    mostRecentAnalysis != null ? mostRecentAnalysis.commands : []
  )

  const requiredModuleTypes = requiredModuleModels.map(getModuleType)

  const robotType = mostRecentAnalysis?.robotType ?? null

  return (
    <Flex
      alignItems={ALIGN_FLEX_START}
      flex="1 0 100%"
      gridGap={SPACING.spacing16}
    >
      <Box
        size="6rem"
        height="auto"
        data-testid={`ProtocolCard_deckLayout_${protocolDisplayName}`}
      >
        {
          {
            missing: <Icon name="ot-spinner" spin size={SIZE_3} />,
            loading: <Icon name="ot-spinner" spin size={SIZE_3} />,
            error: <Box size="6rem" backgroundColor={COLORS.medGreyEnabled} />,
            complete: (
              <DeckThumbnail
                commands={mostRecentAnalysis?.commands ?? []}
                labware={mostRecentAnalysis?.labware ?? []}
              />
            ),
          }[analysisStatus]
        }
      </Box>
      <Flex
        flex="1 0"
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
      >
        {/* error and protocol name section */}
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
          {analysisStatus === 'error' ? (
            <ProtocolAnalysisFailure
              protocolKey={protocolKey}
              errors={mostRecentAnalysis?.errors.map(e => e.detail) ?? []}
            />
          ) : null}
          <StyledText
            as="h3"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            data-testid={`ProtocolCard_${protocolDisplayName}`}
            overflowWrap="anywhere"
          >
            {protocolDisplayName}
          </StyledText>
        </Flex>
        {/* data section */}
        {analysisStatus === 'loading' ? (
          <StyledText as="p" flex="1" color={COLORS.darkGreyEnabled}>
            {t('loading_data')}
          </StyledText>
        ) : (
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            <Flex gridGap={SPACING.spacing16}>
              <Flex
                flex={`0 0 ${
                  robotType === FLEX_STANDARD_MODEL ? '6.2rem' : SIZE_2
                }`}
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing4}
              >
                <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                  {t('robot')}
                </StyledText>
                <StyledText as="p">
                  {getRobotTypeDisplayName(robotType)}
                </StyledText>
              </Flex>
              <Flex
                flex="1"
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing4}
                data-testid={`ProtocolCard_instruments_${protocolDisplayName}`}
                minWidth="10.625rem"
              >
                <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                  {t('shared:instruments')}
                </StyledText>
                {
                  {
                    missing: <StyledText as="p">{t('no_data')}</StyledText>,
                    loading: <StyledText as="p">{t('no_data')}</StyledText>,
                    error: <StyledText as="p">{t('no_data')}</StyledText>,
                    complete: (
                      <Flex flexWrap={WRAP} gridGap={SPACING.spacing4}>
                        {/* TODO(bh, 2022-10-14): insert 96-channel pipette if found */}
                        {leftMountPipetteName != null ? (
                          <InstrumentContainer
                            displayName={
                              getPipetteNameSpecs(leftMountPipetteName)
                                ?.displayName as string
                            }
                          />
                        ) : null}
                        {rightMountPipetteName != null ? (
                          <InstrumentContainer
                            displayName={
                              getPipetteNameSpecs(rightMountPipetteName)
                                ?.displayName as string
                            }
                          />
                        ) : null}
                        {mostRecentAnalysis != null &&
                        getProtocolUsesGripper(mostRecentAnalysis) ? (
                          <InstrumentContainer
                            displayName={getGripperDisplayName('gripperV1')}
                          />
                        ) : null}
                      </Flex>
                    ),
                  }[analysisStatus]
                }
              </Flex>
              <Flex
                flex="0 0 6rem"
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing4}
              >
                {requiredModuleTypes.length > 0 ? (
                  <>
                    <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                      {t('modules')}
                    </StyledText>
                    <Flex>
                      {requiredModuleTypes.map((moduleType, index) => (
                        <ModuleIcon
                          key={index}
                          color={COLORS.darkGreyEnabled}
                          moduleType={moduleType}
                          height="1rem"
                          marginRight={SPACING.spacing8}
                        />
                      ))}
                    </Flex>
                  </>
                ) : null}
              </Flex>
            </Flex>
            <Flex
              justifyContent={JUSTIFY_FLEX_END}
              data-testid={`ProtocolCard_date_${protocolDisplayName}`}
            >
              <StyledText as="label" color={COLORS.darkGreyEnabled}>
                {`${t('updated')} ${format(
                  new Date(modified),
                  'MMM dd yy HH:mm'
                )}`}
              </StyledText>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
