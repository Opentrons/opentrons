import * as React from 'react'
import map from 'lodash/map'
import omit from 'lodash/omit'
import isEmpty from 'lodash/isEmpty'
import startCase from 'lodash/startCase'
import { format } from 'date-fns'
import { css } from 'styled-components'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { ErrorBoundary } from 'react-error-boundary'

import {
  Box,
  Btn,
  Flex,
  Icon,
  Link,
  ALIGN_CENTER,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  POSITION_RELATIVE,
  SIZE_1,
  SIZE_5,
  SPACING,
  RoundTab,
  TYPOGRAPHY,
  PrimaryButton,
} from '@opentrons/components'
import {
  parseInitialPipetteNamesByMount,
  parseInitialLoadedModulesBySlot,
  parseInitialLoadedLabwareBySlot,
  parseInitialLoadedLabwareByModuleId,
  parseInitialLoadedLabwareByAdapter,
  parseInitialLoadedFixturesByCutout,
} from '@opentrons/api-client'
import {
  WASTE_CHUTE_LOAD_NAME,
  getGripperDisplayName,
} from '@opentrons/shared-data'

import { Portal } from '../../App/portal'
import { Divider } from '../../atoms/structure'
import { StyledText } from '../../atoms/text'
import { DeckThumbnail } from '../../molecules/DeckThumbnail'
import { LegacyModal } from '../../molecules/LegacyModal'
import {
  useTrackEvent,
  ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
} from '../../redux/analytics'
import {
  getIsProtocolAnalysisInProgress,
  analyzeProtocol,
} from '../../redux/protocol-storage'
import { useFeatureFlag } from '../../redux/config'
import { ChooseRobotToRunProtocolSlideout } from '../ChooseRobotToRunProtocolSlideout'
import { SendProtocolToOT3Slideout } from '../SendProtocolToOT3Slideout'
import { ProtocolAnalysisFailure } from '../ProtocolAnalysisFailure'
import {
  getAnalysisStatus,
  getProtocolDisplayName,
} from '../ProtocolsLanding/utils'
import { getProtocolUsesGripper } from '../ProtocolSetupInstruments/utils'
import { ProtocolOverflowMenu } from '../ProtocolsLanding/ProtocolOverflowMenu'
import { ProtocolStats } from './ProtocolStats'
import { ProtocolLabwareDetails } from './ProtocolLabwareDetails'
import { ProtocolLiquidsDetails } from './ProtocolLiquidsDetails'
import { RobotConfigurationDetails } from './RobotConfigurationDetails'

import type {
  JsonConfig,
  LoadFixtureRunTimeCommand,
  PythonConfig,
} from '@opentrons/shared-data'
import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { State, Dispatch } from '../../redux/types'

const GRID_STYLE = css`
  display: grid;
  width: 100%;
  grid-template-columns: 26.6% 26.6% 26.6% 20.2%;
`

const ZOOM_ICON_STYLE = css`
  border-radius: ${BORDERS.radiusSoftCorners};
  &:hover {
    background: ${COLORS.lightGreyHover};
  }
  &:active {
    background: ${COLORS.lightGreyPressed};
  }
  &:disabled {
    background: ${COLORS.white};
  }
  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.fundamentalsFocus};
  }
`

interface Metadata {
  [key: string]: any
}

interface MetadataDetailsProps {
  description: string
  metadata: Metadata
  protocolType: string
}

function MetadataDetails({
  description,
  metadata,
  protocolType,
}: MetadataDetailsProps): JSX.Element {
  if (protocolType === 'json') {
    return <StyledText as="p">{description}</StyledText>
  } else {
    const filteredMetaData = Object.entries(
      omit(metadata, ['description', 'protocolName', 'author', 'apiLevel'])
    ).map(item => ({ label: item[0], value: item[1] }))

    return (
      <Flex
        flex="1"
        flexDirection={DIRECTION_COLUMN}
        data-testid="ProtocolDetails_description"
      >
        <StyledText as="p">{description}</StyledText>
        {filteredMetaData.map((item, index) => {
          return (
            <React.Fragment key={index}>
              <StyledText as="h6" marginTop={SPACING.spacing8}>
                {startCase(item.label)}
              </StyledText>
              <StyledText as="p">{item.value}</StyledText>
            </React.Fragment>
          )
        })}
      </Flex>
    )
  }
}

interface ReadMoreContentProps {
  metadata: Metadata
  protocolType: 'json' | 'python'
}

const ReadMoreContent = (props: ReadMoreContentProps): JSX.Element => {
  const { metadata, protocolType } = props
  const { t, i18n } = useTranslation('protocol_details')
  const [isReadMore, setIsReadMore] = React.useState(true)

  const description = isEmpty(metadata.description)
    ? t('shared:no_data')
    : metadata.description

  return (
    <Flex flexDirection={DIRECTION_COLUMN}>
      {isReadMore ? (
        <StyledText as="p">{description.slice(0, 160)}</StyledText>
      ) : (
        <MetadataDetails
          description={description}
          metadata={metadata}
          protocolType={protocolType}
        />
      )}
      {(description.length > 160 || protocolType === 'python') && (
        <Link
          role="button"
          css={TYPOGRAPHY.linkPSemiBold}
          marginTop={SPACING.spacing8}
          onClick={() => setIsReadMore(!isReadMore)}
        >
          {isReadMore
            ? i18n.format(t('read_more'), 'capitalize')
            : i18n.format(t('read_less'), 'capitalize')}
        </Link>
      )}
    </Flex>
  )
}

interface ProtocolDetailsProps extends StoredProtocolData {}

export function ProtocolDetails(
  props: ProtocolDetailsProps
): JSX.Element | null {
  const trackEvent = useTrackEvent()
  const dispatch = useDispatch<Dispatch>()
  const { protocolKey, srcFileNames, mostRecentAnalysis, modified } = props
  const { t, i18n } = useTranslation(['protocol_details', 'shared'])
  const enableProtocolStats = useFeatureFlag('protocolStats')
  const [currentTab, setCurrentTab] = React.useState<
    'robot_config' | 'labware' | 'liquids' | 'stats'
  >('robot_config')
  const [
    showChooseRobotToRunProtocolSlideout,
    setShowChooseRobotToRunProtocolSlideout,
  ] = React.useState<boolean>(false)
  const [
    showSendProtocolToOT3Slideout,
    setShowSendProtocolToOT3Slideout,
  ] = React.useState<boolean>(false)
  const [showDeckViewModal, setShowDeckViewModal] = React.useState(false)

  React.useEffect(() => {
    if (mostRecentAnalysis != null && !('liquids' in mostRecentAnalysis)) {
      dispatch(analyzeProtocol(protocolKey))
    }
  }, [])

  const isAnalyzing = useSelector((state: State) =>
    getIsProtocolAnalysisInProgress(state, protocolKey)
  )
  const analysisStatus = getAnalysisStatus(isAnalyzing, mostRecentAnalysis)
  if (analysisStatus === 'missing') return null

  const { left: leftMountPipetteName, right: rightMountPipetteName } =
    mostRecentAnalysis != null
      ? parseInitialPipetteNamesByMount(mostRecentAnalysis.commands)
      : { left: null, right: null }

  const requiredExtensionInstrumentName =
    mostRecentAnalysis != null && getProtocolUsesGripper(mostRecentAnalysis)
      ? getGripperDisplayName('gripperV1')
      : null

  const requiredModuleDetails =
    mostRecentAnalysis?.commands != null
      ? map(parseInitialLoadedModulesBySlot(mostRecentAnalysis.commands))
      : []

  // TODO: IMMEDIATELY remove stubbed fixture as soon as PE supports loadFixture
  const STUBBED_LOAD_FIXTURE: LoadFixtureRunTimeCommand = {
    id: 'stubbed_load_fixture',
    commandType: 'loadFixture',
    params: {
      fixtureId: 'stubbedFixtureId',
      loadName: WASTE_CHUTE_LOAD_NAME,
      location: { cutout: 'D3' },
    },
    createdAt: 'fakeTimestamp',
    startedAt: 'fakeTimestamp',
    completedAt: 'fakeTimestamp',
    status: 'succeeded',
  }
  const requiredFixtureDetails =
    mostRecentAnalysis?.commands != null
      ? [
          ...map(
            parseInitialLoadedFixturesByCutout(mostRecentAnalysis.commands)
          ),
          STUBBED_LOAD_FIXTURE,
        ]
      : []

  const requiredLabwareDetails =
    mostRecentAnalysis != null
      ? map({
          ...parseInitialLoadedLabwareByModuleId(
            mostRecentAnalysis.commands != null
              ? mostRecentAnalysis.commands
              : []
          ),
          ...parseInitialLoadedLabwareBySlot(
            mostRecentAnalysis.commands != null
              ? mostRecentAnalysis.commands
              : []
          ),
          ...parseInitialLoadedLabwareByAdapter(
            mostRecentAnalysis.commands != null
              ? mostRecentAnalysis.commands
              : []
          ),
        }).filter(
          labware => labware.result?.definition?.parameters?.format !== 'trash'
        )
      : []

  const protocolDisplayName = getProtocolDisplayName(
    protocolKey,
    srcFileNames,
    mostRecentAnalysis
  )

  const getCreationMethod = (config: JsonConfig | PythonConfig): string => {
    if (config.protocolType === 'json') {
      return t('protocol_designer_version', {
        version: config.schemaVersion.toFixed(1),
      })
    } else {
      return t('python_api_version', {
        version:
          config.apiVersion != null ? config.apiVersion?.join('.') : null,
      })
    }
  }

  const creationMethod =
    mostRecentAnalysis != null
      ? getCreationMethod(mostRecentAnalysis.config) ?? t('shared:no_data')
      : t('shared:no_data')
  const author =
    mostRecentAnalysis != null
      ? mostRecentAnalysis?.metadata?.author ?? t('shared:no_data')
      : t('shared:no_data')
  const lastAnalyzed =
    mostRecentAnalysis?.createdAt != null
      ? format(new Date(mostRecentAnalysis.createdAt), 'M/d/yy HH:mm')
      : t('shared:no_data')
  const robotType = mostRecentAnalysis?.robotType ?? null

  const contentsByTabName = {
    labware: (
      <ProtocolLabwareDetails requiredLabwareDetails={requiredLabwareDetails} />
    ),
    robot_config: (
      <RobotConfigurationDetails
        leftMountPipetteName={leftMountPipetteName}
        rightMountPipetteName={rightMountPipetteName}
        extensionInstrumentName={requiredExtensionInstrumentName}
        requiredModuleDetails={requiredModuleDetails}
        requiredFixtureDetails={requiredFixtureDetails}
        isLoading={analysisStatus === 'loading'}
        robotType={robotType}
      />
    ),
    liquids: (
      <ProtocolLiquidsDetails
        commands={
          mostRecentAnalysis?.commands != null
            ? mostRecentAnalysis?.commands
            : []
        }
        liquids={
          mostRecentAnalysis?.liquids != null ? mostRecentAnalysis?.liquids : []
        }
      />
    ),
    stats: enableProtocolStats ? (
      <ProtocolStats analysis={mostRecentAnalysis} />
    ) : null,
  }

  const deckThumbnail = <DeckThumbnail protocolAnalysis={mostRecentAnalysis} />

  const deckViewByAnalysisStatus = {
    missing: <Box size="14rem" backgroundColor={COLORS.medGreyEnabled} />,
    loading: <Box size="14rem" backgroundColor={COLORS.medGreyEnabled} />,
    error: <Box size="14rem" backgroundColor={COLORS.medGreyEnabled} />,
    complete: (
      <Box size="14rem" height="auto">
        {deckThumbnail}
      </Box>
    ),
  }

  const handleRunProtocolButtonClick = (): void => {
    trackEvent({
      name: ANALYTICS_PROTOCOL_PROCEED_TO_RUN,
      properties: { sourceLocation: 'ProtocolsDetail' },
    })
    setShowChooseRobotToRunProtocolSlideout(true)
  }

  const UNKNOWN_ATTACHMENT_ERROR = `${protocolDisplayName} protocol uses 
  instruments or modules from a future version of Opentrons software. Please update 
  the app to the most recent version to run this protocol.`

  const UnknownAttachmentError = (
    <ProtocolAnalysisFailure
      protocolKey={protocolKey}
      errors={[UNKNOWN_ATTACHMENT_ERROR]}
    />
  )

  return (
    <>
      <Portal level="top">
        {showDeckViewModal ? (
          <LegacyModal
            title={t('deck_view')}
            onClose={() => setShowDeckViewModal(false)}
          >
            {deckThumbnail}
          </LegacyModal>
        ) : null}
      </Portal>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing16}
        width="100%"
      >
        <ErrorBoundary fallback={UnknownAttachmentError}>
          <ChooseRobotToRunProtocolSlideout
            onCloseClick={() => setShowChooseRobotToRunProtocolSlideout(false)}
            showSlideout={showChooseRobotToRunProtocolSlideout}
            storedProtocolData={props}
          />
          <SendProtocolToOT3Slideout
            isExpanded={showSendProtocolToOT3Slideout}
            onCloseClick={() => setShowSendProtocolToOT3Slideout(false)}
            storedProtocolData={props}
          />

          <Flex
            backgroundColor={COLORS.white}
            border={`1px solid ${COLORS.medGreyEnabled}`}
            borderRadius={BORDERS.radiusSoftCorners}
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
              mostRecentAnalysis != null &&
              mostRecentAnalysis.errors.length > 0 ? (
                <ProtocolAnalysisFailure
                  protocolKey={protocolKey}
                  errors={mostRecentAnalysis.errors.map(e => e.detail)}
                />
              ) : null}
              <StyledText
                css={TYPOGRAPHY.h2SemiBold}
                marginBottom={SPACING.spacing16}
                data-testid={`ProtocolDetails_${protocolDisplayName}`}
                overflowWrap="anywhere"
              >
                {protocolDisplayName}
              </StyledText>
              <Flex css={GRID_STYLE}>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  data-testid="ProtocolDetails_creationMethod"
                >
                  <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                    {t('creation_method')}
                  </StyledText>
                  <StyledText as="p">
                    {analysisStatus === 'loading'
                      ? t('shared:loading')
                      : creationMethod}
                  </StyledText>
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  data-testid="ProtocolDetails_lastUpdated"
                >
                  <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                    {t('last_updated')}
                  </StyledText>
                  <StyledText as="p">
                    {analysisStatus === 'loading'
                      ? t('shared:loading')
                      : format(new Date(modified), 'M/d/yy HH:mm')}
                  </StyledText>
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  data-testid="ProtocolDetails_lastAnalyzed"
                >
                  <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                    {t('last_analyzed')}
                  </StyledText>
                  <StyledText as="p">
                    {analysisStatus === 'loading'
                      ? t('shared:loading')
                      : lastAnalyzed}
                  </StyledText>
                </Flex>
                <Flex
                  css={css`
                    display: grid;
                    justify-self: end;
                  `}
                >
                  <PrimaryButton
                    onClick={() => handleRunProtocolButtonClick()}
                    data-testid="ProtocolDetails_runProtocol"
                    disabled={analysisStatus === 'loading'}
                  >
                    {t('start_setup')}
                  </PrimaryButton>
                </Flex>
              </Flex>
              <Divider marginY={SPACING.spacing16} />
              <Flex css={GRID_STYLE}>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  data-testid="ProtocolDetails_author"
                >
                  <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                    {t('org_or_author')}
                  </StyledText>
                  <StyledText
                    as="p"
                    marginRight={SPACING.spacing20}
                    overflowWrap="anywhere"
                  >
                    {analysisStatus === 'loading'
                      ? t('shared:loading')
                      : author}
                  </StyledText>
                </Flex>
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  data-testid="ProtocolDetails_description"
                >
                  <StyledText as="h6" color={COLORS.darkGreyEnabled}>
                    {t('description')}
                  </StyledText>
                  {analysisStatus === 'loading' ? (
                    <StyledText as="p">{t('shared:loading')}</StyledText>
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
                handleRunProtocol={() =>
                  setShowChooseRobotToRunProtocolSlideout(true)
                }
                handleSendProtocolToOT3={() =>
                  setShowSendProtocolToOT3Slideout(true)
                }
                storedProtocolData={props}
                data-testid="ProtocolDetails_overFlowMenu"
              />
            </Box>
          </Flex>
          <Flex
            flexDirection={DIRECTION_ROW}
            justifyContent={JUSTIFY_SPACE_BETWEEN}
          >
            <Flex
              flex={`0 0 ${String(SIZE_5)}`}
              flexDirection={DIRECTION_COLUMN}
              backgroundColor={COLORS.white}
              border={`1px solid ${String(COLORS.medGreyEnabled)}`}
              borderRadius={BORDERS.radiusSoftCorners}
              height="100%"
              data-testid="ProtocolDetails_deckMap"
            >
              <Flex
                alignItems={ALIGN_CENTER}
                justifyContent={JUSTIFY_SPACE_BETWEEN}
                padding={SPACING.spacing16}
              >
                <StyledText as="h3" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
                  {t('deck_view')}
                </StyledText>
                <Btn
                  alignItems={ALIGN_CENTER}
                  disabled={analysisStatus !== 'complete'}
                  display={DISPLAY_FLEX}
                  justifyContent={JUSTIFY_CENTER}
                  height={SPACING.spacing24}
                  width={SPACING.spacing24}
                  css={ZOOM_ICON_STYLE}
                  onClick={() => setShowDeckViewModal(true)}
                >
                  <Icon name="union" size={SIZE_1} />
                </Btn>
              </Flex>
              <Box padding={SPACING.spacing16} backgroundColor={COLORS.white}>
                {deckViewByAnalysisStatus[analysisStatus]}
              </Box>
            </Flex>

            <Flex
              width="100%"
              height="100%"
              flexDirection={DIRECTION_COLUMN}
              marginLeft={SPACING.spacing16}
            >
              <Flex>
                <RoundTab
                  data-testid="ProtocolDetails_robotConfig"
                  isCurrent={currentTab === 'robot_config'}
                  onClick={() => setCurrentTab('robot_config')}
                >
                  <StyledText>
                    {i18n.format(t('robot_configuration'), 'capitalize')}
                  </StyledText>
                </RoundTab>
                <RoundTab
                  data-testid="ProtocolDetails_labware"
                  isCurrent={currentTab === 'labware'}
                  onClick={() => setCurrentTab('labware')}
                >
                  <StyledText>
                    {i18n.format(t('labware'), 'capitalize')}
                  </StyledText>
                </RoundTab>
                {mostRecentAnalysis != null && (
                  <RoundTab
                    data-testid="ProtocolDetails_liquids"
                    isCurrent={currentTab === 'liquids'}
                    onClick={() => setCurrentTab('liquids')}
                  >
                    <StyledText>
                      {i18n.format(t('liquids'), 'capitalize')}
                    </StyledText>
                  </RoundTab>
                )}
                {enableProtocolStats && mostRecentAnalysis != null && (
                  <RoundTab
                    data-testid="ProtocolDetails_stats"
                    isCurrent={currentTab === 'stats'}
                    onClick={() => setCurrentTab('stats')}
                  >
                    <StyledText>
                      {i18n.format(t('stats'), 'capitalize')}
                    </StyledText>
                  </RoundTab>
                )}
              </Flex>
              <Box
                backgroundColor={COLORS.white}
                border={BORDERS.lineBorder}
                // remove left upper corner border radius when first tab is active
                borderRadius={`${
                  currentTab === 'robot_config'
                    ? '0'
                    : String(BORDERS.radiusSoftCorners)
                } ${String(BORDERS.radiusSoftCorners)} ${String(
                  BORDERS.radiusSoftCorners
                )} ${String(BORDERS.radiusSoftCorners)}`}
                padding={`${SPACING.spacing16} ${SPACING.spacing16} 0 ${SPACING.spacing16}`}
              >
                {contentsByTabName[currentTab]}
              </Box>
            </Flex>
          </Flex>
        </ErrorBoundary>
      </Flex>
    </>
  )
}
