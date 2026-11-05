import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

import {
  ALIGN_CENTER,
  BasicButton,
  BORDERS,
  Box,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_RELATIVE,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
  Tag,
  WRAP,
} from '@opentrons/components'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import {
  ANALYTICS_LAUNCH_PROTOCOL_VISUALIZATION,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  useTrackEvent,
} from '/app/redux/analytics'

import { ProtocolAnalysisFailure } from '../ProtocolAnalysisFailure'
import { ProtocolOverflowMenu } from '../ProtocolsLanding/ProtocolOverflowMenu'
import { ProtocolStatusBanner } from '../ProtocolStatusBanner'

import type { ReactNode } from 'react'
import type {
  JsonConfig,
  ProtocolAnalysisOutput,
  PythonConfig,
  RobotType,
} from '@opentrons/shared-data'
import type {
  GroupedCommands,
  StoredProtocolData,
} from '/app/redux/protocol-storage'
import type { AnalysisStatus } from '/app/transformations/analysis'

const MAX_DESCRIPTION_LENGTH = 220

interface ProtocolDetailsProps extends StoredProtocolData {
  groupedCommands: GroupedCommands | null
}

interface ProtocolDetailsHeaderProps {
  analysisStatus: AnalysisStatus
  mostRecentAnalysis: ProtocolAnalysisOutput | null
  protocolKey: string
  protocolDisplayName: string
  robotType: RobotType | null
  modified: number
  setShowChooseRobotToRunProtocolSlideout: (show: boolean) => void
  setShowSendProtocolToFlexSlideout: (show: boolean) => void
  props: ProtocolDetailsProps
}

export function ProtocolDetailsHeader({
  analysisStatus,
  mostRecentAnalysis,
  protocolKey,
  protocolDisplayName,
  robotType,
  modified,
  setShowChooseRobotToRunProtocolSlideout,
  setShowSendProtocolToFlexSlideout,
  props,
}: ProtocolDetailsHeaderProps): ReactNode {
  const { t, i18n } = useTranslation(['protocol_details', 'shared'])
  const navigate = useNavigate()
  const trackEvent = useTrackEvent()
  const [isReadMore, setIsReadMore] = useState(true)
  const numberOfAtomicCommands = mostRecentAnalysis?.commands.length ?? 0
  const protocolDescription = mostRecentAnalysis?.metadata.description ?? ''
  const slicedDescription = protocolDescription.slice(0, MAX_DESCRIPTION_LENGTH)
  const isDescriptionTruncated =
    protocolDescription.length > MAX_DESCRIPTION_LENGTH

  const getCreationMethod = (
    config: JsonConfig | PythonConfig,
    metadata: { [key: string]: any }
  ): string => {
    if (config.protocolType === 'json') {
      return t('protocol_designer_version', {
        version: config.schemaVersion.toFixed(1),
      })
    } else {
      if ('protocolDesigner' in metadata) {
        return t('protocol_designer_version', {
          version: parseInt(metadata.protocolDesigner as string).toFixed(1),
        })
      } else {
        return t('python_api_version', {
          version:
            config.apiVersion != null ? config.apiVersion?.join('.') : null,
        })
      }
    }
  }

  const creationMethod =
    mostRecentAnalysis != null
      ? (getCreationMethod(
          mostRecentAnalysis.config,
          mostRecentAnalysis.metadata
        ) ?? t('shared:no_data'))
      : t('shared:no_data')

  const author =
    mostRecentAnalysis != null
      ? (mostRecentAnalysis?.metadata?.author ?? t('shared:no_data'))
      : t('shared:no_data')

  const lastAnalyzed =
    mostRecentAnalysis?.createdAt != null
      ? format(new Date(mostRecentAnalysis.createdAt), 'M/d/yy HH:mm')
      : t('shared:no_data')

  const handleRunProtocolButtonClick = (): void => {
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { sourceLocation: 'ProtocolsDetail' },
    })
    setShowChooseRobotToRunProtocolSlideout(true)
  }

  const handleClickTimeline = (): void => {
    trackEvent({
      name: ANALYTICS_LAUNCH_PROTOCOL_VISUALIZATION,
      properties: {
        sourceLocation: 'protocol details header',
        numberOfAtomicCommands,
      },
    })
    navigate(`/protocols/${protocolKey}/visualization`)
  }

  return (
    <Flex
      backgroundColor={COLORS.white}
      borderRadius={BORDERS.borderRadius4}
      position={POSITION_RELATIVE}
      flexDirection={DIRECTION_ROW}
      width="100%"
      marginBottom={SPACING.spacing16}
    >
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing16}
        padding={`${SPACING.spacing16} 0 ${SPACING.spacing16} ${SPACING.spacing16}`}
        width="100%"
      >
        {analysisStatus !== 'loading' &&
        mostRecentAnalysis?.result === 'parameter-value-required' ? (
          <ProtocolStatusBanner />
        ) : null}
        {mostRecentAnalysis != null && analysisStatus === 'error' ? (
          <ProtocolAnalysisFailure
            protocolKey={protocolKey}
            errors={mostRecentAnalysis.errors.map(e => e.detail)}
          />
        ) : null}
        <Flex flexDirection={DIRECTION_COLUMN} gap={SPACING.spacing16}>
          <Flex flexDirection={DIRECTION_COLUMN} gap={SPACING.spacing16}>
            <Flex
              flexDirection={DIRECTION_ROW}
              gap={SPACING.spacing24}
              justifyContent={JUSTIFY_SPACE_BETWEEN}
              alignItems={ALIGN_CENTER}
              paddingRight={SPACING.spacing24}
            >
              <StyledText
                desktopStyle="headingSmallBold"
                style={{ whiteSpace: 'normal', overflowWrap: 'anywhere' }}
              >
                {protocolDisplayName}
              </StyledText>
              <Flex gridGap={SPACING.spacing8}>
                {robotType === OT2_ROBOT_TYPE ? null : (
                  <SecondaryButton
                    onClick={handleClickTimeline}
                    cursor={CURSOR_POINTER}
                  >
                    {t('visualize')}
                  </SecondaryButton>
                )}
                <PrimaryButton
                  onClick={() => {
                    handleRunProtocolButtonClick()
                  }}
                  data-testid="ProtocolDetails_runProtocol"
                  disabled={analysisStatus === 'loading'}
                  whiteSpace="nowrap"
                >
                  {t('start_setup')}
                </PrimaryButton>
              </Flex>
            </Flex>
            {/* description section */}
            <Flex>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                color={COLORS.grey60}
              >
                {isDescriptionTruncated && isReadMore
                  ? `${slicedDescription}... `
                  : `${protocolDescription} `}
                {isDescriptionTruncated ? (
                  <BasicButton
                    onClick={() => {
                      setIsReadMore(!isReadMore)
                    }}
                    underLine
                  >
                    {isReadMore
                      ? i18n.format(t('read_more'), 'capitalize')
                      : i18n.format(t('read_less'), 'capitalize')}
                  </BasicButton>
                ) : null}
              </StyledText>
            </Flex>
            {/* tag section */}
            <Flex
              flexDirection={DIRECTION_ROW}
              gap={SPACING.spacing4}
              flexWrap={WRAP}
            >
              <Tag
                text={`${i18n.format(t('date_added'), 'titleCase')}:  ${format(
                  new Date(modified),
                  'M/d/yy HH:mm'
                )}`}
                type="default"
              />
              <Tag
                text={`${i18n.format(
                  t('last_analyzed'),
                  'titleCase'
                )}:  ${lastAnalyzed}`}
                type="default"
              />
              <Tag text={creationMethod} type="default" />
              <Tag text={`Author: ${author}`} type="default" />
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      <Box
        position={POSITION_RELATIVE}
        top={SPACING.spacing2}
        right={SPACING.spacing2}
      >
        <ProtocolOverflowMenu
          handleRunProtocol={() => {
            setShowChooseRobotToRunProtocolSlideout(true)
          }}
          handleSendProtocolToFlex={() => {
            setShowSendProtocolToFlexSlideout(true)
          }}
          storedProtocolData={props}
          data-testid="ProtocolDetails_overFlowMenu"
        />
      </Box>
    </Flex>
  )
}
