import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { css } from 'styled-components'

import {
  BORDERS,
  Box,
  COLORS,
  CURSOR_POINTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_GRID,
  Flex,
  JUSTIFY_END,
  LegacyStyledText,
  OVERFLOW_WRAP_ANYWHERE,
  POSITION_RELATIVE,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { FLEX_ROBOT_TYPE } from '@opentrons/shared-data'

import { Divider } from '/app/atoms/structure'
import {
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
  useTrackEvent,
} from '/app/redux/analytics'

import { ProtocolAnalysisFailure } from '../ProtocolAnalysisFailure'
import { ProtocolOverflowMenu } from '../ProtocolsLanding/ProtocolOverflowMenu'
import { ProtocolStatusBanner } from '../ProtocolStatusBanner'
import { ReadMoreContent } from './ReadMoreContent'

import type {
  JsonConfig,
  ProtocolAnalysisOutput,
  PythonConfig,
  RobotType,
} from '@opentrons/shared-data'
import type { AnalysisStatus } from '/app/transformations/analysis'
import type { ProtocolDetailsProps } from './UpdatedProtocolDetails'

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
}: ProtocolDetailsHeaderProps): JSX.Element {
  const { t } = useTranslation(['protocol_details', 'shared'])
  const navigate = useNavigate()
  const trackEvent = useTrackEvent()

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
      ? getCreationMethod(
          mostRecentAnalysis.config,
          mostRecentAnalysis.metadata
        ) ?? t('shared:no_data')
      : t('shared:no_data')

  const author =
    mostRecentAnalysis != null
      ? mostRecentAnalysis?.metadata?.author ?? t('shared:no_data')
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
        <LegacyStyledText
          css={TYPOGRAPHY.h2SemiBold}
          marginBottom={SPACING.spacing16}
          data-testid={`ProtocolDetails_${protocolDisplayName}`}
          overflowWrap={OVERFLOW_WRAP_ANYWHERE}
        >
          {protocolDisplayName}
        </LegacyStyledText>
        <Flex
          display={DISPLAY_GRID}
          width="100%"
          gridTemplateColumns={
            robotType === FLEX_ROBOT_TYPE
              ? '25.5% 25.5% 25.5% 22.9%'
              : '26.6% 26.6% 26.6% 20.2%'
          }
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            data-testid="ProtocolDetails_creationMethod"
          >
            <LegacyStyledText as="h6" color={COLORS.grey60}>
              {t('creation_method')}
            </LegacyStyledText>
            <LegacyStyledText as="p">
              {analysisStatus === 'loading'
                ? t('shared:loading')
                : creationMethod}
            </LegacyStyledText>
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            data-testid="ProtocolDetails_lastUpdated"
          >
            <LegacyStyledText as="h6" color={COLORS.grey60}>
              {t('last_updated')}
            </LegacyStyledText>
            <LegacyStyledText as="p">
              {analysisStatus === 'loading'
                ? t('shared:loading')
                : format(new Date(modified), 'M/d/yy HH:mm')}
            </LegacyStyledText>
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            data-testid="ProtocolDetails_lastAnalyzed"
          >
            <LegacyStyledText as="h6" color={COLORS.grey60}>
              {t('last_analyzed')}
            </LegacyStyledText>
            <LegacyStyledText as="p">
              {analysisStatus === 'loading'
                ? t('shared:loading')
                : lastAnalyzed}
            </LegacyStyledText>
          </Flex>
          <Flex gridGap={SPACING.spacing4} justifySelf={JUSTIFY_END}>
            <SecondaryButton
              onClick={handleClickTimeline}
              cursor={CURSOR_POINTER}
            >
              {t('visualize')}
            </SecondaryButton>

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
        <Divider marginY={SPACING.spacing16} />
        <Flex css={TWO_COL_GRID_STYLE}>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            data-testid="ProtocolDetails_author"
          >
            <LegacyStyledText as="h6" color={COLORS.grey60}>
              {t('org_or_author')}
            </LegacyStyledText>
            <LegacyStyledText as="p" overflowWrap={OVERFLOW_WRAP_ANYWHERE}>
              {analysisStatus === 'loading' ? t('shared:loading') : author}
            </LegacyStyledText>
          </Flex>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            data-testid="ProtocolDetails_description"
          >
            <LegacyStyledText as="h6" color={COLORS.grey60}>
              {t('description')}
            </LegacyStyledText>
            {analysisStatus === 'loading' ? (
              <LegacyStyledText as="p">{t('shared:loading')}</LegacyStyledText>
            ) : null}
            {mostRecentAnalysis != null ? (
              <ReadMoreContent
                metadata={mostRecentAnalysis.metadata}
                protocolType={mostRecentAnalysis.config.protocolType}
              />
            ) : null}
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

const TWO_COL_GRID_STYLE = css`
  display: ${DISPLAY_GRID};
  grid-gap: ${SPACING.spacing24};
  grid-template-columns: 22.5% 77.5%;
`
