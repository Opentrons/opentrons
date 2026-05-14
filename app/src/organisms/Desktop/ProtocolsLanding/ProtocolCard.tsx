import { ErrorBoundary } from 'react-error-boundary'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

import {
  ALIGN_FLEX_START,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  InlineNotification,
  JUSTIFY_FLEX_END,
  ModuleIcon,
  OVERFLOW_WRAP_ANYWHERE,
  POSITION_ABSOLUTE,
  ProtocolDeck,
  SPACING,
  StyledText,
  WRAP,
} from '@opentrons/components'
import {
  getGripperDisplayName,
  getModuleType,
  getPipetteNameSpecs,
  OT2_ROBOT_TYPE,
  parseAllRequiredModuleModels,
  parseInitialPipetteNamesByMount,
} from '@opentrons/shared-data'

import { InstrumentContainer } from '/app/atoms/InstrumentContainer'
import { getIsProtocolAnalysisInProgress } from '/app/redux/protocol-storage'
import { openOT2App } from '/app/redux/shell'
import { getAnalysisStatus } from '/app/transformations/analysis'
import { getProtocolUsesGripper } from '/app/transformations/commands'
import { getProtocolDisplayName } from '/app/transformations/protocols'

import { ProtocolAnalysisFailure } from '../ProtocolAnalysisFailure'
import { ProtocolAnalysisStale } from '../ProtocolAnalysisFailure/ProtocolAnalysisStale'
import { ProtocolStatusBanner } from '../ProtocolStatusBanner'
import { ProtocolOverflowMenu } from './ProtocolOverflowMenu'

import type { MouseEvent } from 'react'
import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { StoredProtocolData } from '/app/redux/protocol-storage'
import type { Dispatch, State } from '/app/redux/types'

const INVALID_ROBOT_TYPE_ERROR = 'This protocol is designed for an OT-2 robot.'

interface ProtocolCardProps {
  handleRunProtocol: (storedProtocolData: StoredProtocolData) => void
  handleSendProtocolToFlex: (storedProtocolData: StoredProtocolData) => void
  storedProtocolData: StoredProtocolData
}

export function ProtocolCard(props: ProtocolCardProps): JSX.Element | null {
  const navigate = useNavigate()
  const { handleRunProtocol, handleSendProtocolToFlex, storedProtocolData } =
    props
  const { protocolKey, srcFileNames, mostRecentAnalysis, modified } =
    storedProtocolData
  const isAnalyzing = useSelector((state: State) =>
    getIsProtocolAnalysisInProgress(state, protocolKey)
  )
  const protocolDisplayName = getProtocolDisplayName(
    protocolKey,
    srcFileNames,
    mostRecentAnalysis
  )

  const UNKNOWN_ATTACHMENT_ERROR = `${protocolDisplayName} protocol uses
  instruments or modules from a future version of Opentrons software. Please update
  the app to the most recent version to run this protocol.`

  const invalidRobotType =
    mostRecentAnalysis?.errors.some(error =>
      error.detail.includes(INVALID_ROBOT_TYPE_ERROR)
    ) ?? false

  const UnknownAttachmentError = (
    <ProtocolAnalysisFailure
      protocolKey={protocolKey}
      errors={[UNKNOWN_ATTACHMENT_ERROR]}
    />
  )

  const handleClickCard = (): void => {
    if (
      mostRecentAnalysis?.robotType != null &&
      mostRecentAnalysis.robotType !== OT2_ROBOT_TYPE
    ) {
      navigate(`/protocols/${protocolKey}`)
    }
  }

  return (
    <Box
      backgroundColor={COLORS.white}
      borderRadius={BORDERS.borderRadius8}
      cursor="pointer"
      minWidth="36rem"
      padding={SPACING.spacing16}
      position="relative"
      onClick={handleClickCard}
    >
      <ErrorBoundary fallback={UnknownAttachmentError}>
        <AnalysisInfo
          protocolKey={protocolKey}
          mostRecentAnalysis={mostRecentAnalysis}
          protocolDisplayName={protocolDisplayName}
          isAnalyzing={isAnalyzing}
          modified={modified}
          invalidRobotType={invalidRobotType}
        />
      </ErrorBoundary>
      <Box
        position={POSITION_ABSOLUTE}
        top={SPACING.spacing4}
        right={SPACING.spacing4}
      >
        <ProtocolOverflowMenu
          handleRunProtocol={handleRunProtocol}
          handleSendProtocolToFlex={handleSendProtocolToFlex}
          storedProtocolData={storedProtocolData}
          invalidRobotType={invalidRobotType}
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
  invalidRobotType: boolean
  mostRecentAnalysis?: ProtocolAnalysisOutput | null
}
function AnalysisInfo(props: AnalysisInfoProps): JSX.Element {
  const {
    protocolKey,
    protocolDisplayName,
    isAnalyzing,
    mostRecentAnalysis,
    invalidRobotType,
    modified,
  } = props
  const dispatch = useDispatch<Dispatch>()
  const { t, i18n } = useTranslation(['protocol_list', 'shared'])
  const analysisStatus = getAnalysisStatus(isAnalyzing, mostRecentAnalysis)

  const { left: leftMountPipetteName, right: rightMountPipetteName } =
    mostRecentAnalysis != null
      ? parseInitialPipetteNamesByMount(mostRecentAnalysis.commands)
      : { left: null, right: null }
  const requiredModuleModels = parseAllRequiredModuleModels(
    mostRecentAnalysis != null ? mostRecentAnalysis.commands : []
  )

  const requiredModuleTypes = requiredModuleModels.map(getModuleType)

  const hasPeripherals =
    mostRecentAnalysis?.commandPreconditions?.isCameraUsed ?? false

  // If OT-2 app is installed, OT-2 app will be opened.
  // If OT-2 app isn't installed, a web browser will open the OT-2 app download page
  // Both of actions are handled by Electron side
  // An error will happen if a user doesn't have a web browser installed
  const handleOpenOT2App = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    dispatch(openOT2App())
  }

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
            missing: (
              <Icon name="ot-spinner" color={COLORS.grey60} spin size="4rem" />
            ),
            loading: (
              <Icon name="ot-spinner" color={COLORS.grey60} spin size="4rem" />
            ),
            error: (
              <Box
                size="6rem"
                backgroundColor={COLORS.grey30}
                borderRadius={SPACING.spacing8}
              />
            ),
            parameterRequired: (
              <Box
                size="6rem"
                backgroundColor={COLORS.grey30}
                borderRadius={SPACING.spacing8}
              />
            ),
            stale: (
              <Box
                size="6rem"
                backgroundColor={COLORS.grey30}
                borderRadius={SPACING.spacing8}
              />
            ),
            complete:
              mostRecentAnalysis != null && !invalidRobotType ? (
                <ProtocolDeck protocolAnalysis={mostRecentAnalysis} />
              ) : (
                <Box
                  size="6rem"
                  backgroundColor={COLORS.grey30}
                  borderRadius={BORDERS.borderRadius8}
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
          {analysisStatus === 'parameterRequired' ? (
            <ProtocolStatusBanner />
          ) : null}
          {!invalidRobotType && analysisStatus === 'error' ? (
            <ProtocolAnalysisFailure
              protocolKey={protocolKey}
              errors={mostRecentAnalysis?.errors.map(e => e.detail) ?? []}
            />
          ) : null}
          {analysisStatus === 'stale' ? (
            <ProtocolAnalysisStale protocolKey={protocolKey} />
          ) : null}

          {invalidRobotType && analysisStatus === 'error' ? (
            <Box paddingRight={SPACING.spacing24}>
              <InlineNotification
                type="alert"
                heading={t('branded:ot2_protocol_detected')}
                message={t('branded:ot2_protocol_detected_description')}
                linkText={t('branded:get_the_app')}
                onLinkClick={handleOpenOT2App}
              />
            </Box>
          ) : null}
          <Flex paddingRight={SPACING.spacing24}>
            <StyledText
              desktopStyle="bodyDefaultSemiBold"
              data-testid={`ProtocolCard_${protocolDisplayName}`}
              overflowWrap={OVERFLOW_WRAP_ANYWHERE}
            >
              {protocolDisplayName}
            </StyledText>
          </Flex>
        </Flex>
        {/* data section */}
        {analysisStatus === 'loading' ? (
          <StyledText
            desktopStyle="bodyDefaultRegular"
            flex="1"
            color={COLORS.grey60}
          >
            {t('loading_data')}
          </StyledText>
        ) : (
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing8}>
            <Flex gridGap={SPACING.spacing16}>
              <Flex
                flex="1"
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing4}
                data-testid={`ProtocolCard_instruments_${protocolDisplayName}`}
              >
                <StyledText
                  desktopStyle="bodyDefaultRegular"
                  color={COLORS.grey60}
                >
                  {i18n.format(t('shared:instruments'), 'capitalize')}
                </StyledText>
                {
                  {
                    missing: (
                      <StyledText desktopStyle="bodyDefaultRegular">
                        {t('no_data')}
                      </StyledText>
                    ),
                    loading: (
                      <StyledText desktopStyle="bodyDefaultRegular">
                        {t('no_data')}
                      </StyledText>
                    ),
                    error: (
                      <StyledText desktopStyle="bodyDefaultRegular">
                        {t('no_data')}
                      </StyledText>
                    ),
                    parameterRequired: (
                      <StyledText desktopStyle="bodyDefaultRegular">
                        {t('no_data')}
                      </StyledText>
                    ),
                    stale: (
                      <StyledText desktopStyle="bodyDefaultRegular">
                        {t('no_data')}
                      </StyledText>
                    ),
                    complete: (
                      <Flex flexWrap={WRAP} gridGap={SPACING.spacing4}>
                        {/* TODO(bh, 2022-10-14): insert 96-channel pipette if found */}
                        {leftMountPipetteName != null ? (
                          <InstrumentContainer
                            displayName={
                              getPipetteNameSpecs(leftMountPipetteName)
                                ?.displayName!
                            }
                          />
                        ) : null}
                        {rightMountPipetteName != null ? (
                          <InstrumentContainer
                            displayName={
                              getPipetteNameSpecs(rightMountPipetteName)
                                ?.displayName!
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
                flexDirection={DIRECTION_COLUMN}
                width="100%"
                gridGap={SPACING.spacing4}
                flex="0 0 6rem"
              >
                {requiredModuleTypes.length > 0 ? (
                  <>
                    <StyledText
                      desktopStyle="bodyDefaultRegular"
                      color={COLORS.grey60}
                    >
                      {i18n.format('modules', 'capitalize')}
                    </StyledText>
                    <Flex>
                      {requiredModuleTypes.map((moduleType, index) => (
                        <ModuleIcon
                          key={index}
                          color={COLORS.grey50}
                          moduleType={moduleType}
                          height="1rem"
                          marginRight={SPACING.spacing8}
                        />
                      ))}
                    </Flex>
                  </>
                ) : null}
              </Flex>
              {hasPeripherals && (
                <Flex
                  flex="0 0 6rem"
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing4}
                  width="100%"
                >
                  <>
                    <StyledText
                      desktopStyle="bodyDefaultRegular"
                      color={COLORS.grey60}
                    >
                      {t('peripherals')}
                    </StyledText>
                    <Flex flexWrap={WRAP}>
                      <Icon color={COLORS.grey50} name="camera" height="1rem" />
                    </Flex>
                  </>
                </Flex>
              )}
            </Flex>
            <Flex
              justifyContent={JUSTIFY_FLEX_END}
              data-testid={`ProtocolCard_date_${protocolDisplayName}`}
            >
              <StyledText desktopStyle="captionRegular" color={COLORS.grey60}>
                {`${t('updated')} ${format(
                  new Date(modified),
                  'M/d/yy HH:mm'
                )}`}
              </StyledText>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
