import { useState } from 'react'
import { createPortal } from 'react-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import map from 'lodash/map'
import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  BORDERS,
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  DISPLAY_FLEX,
  Flex,
  Icon,
  JUSTIFY_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  LegacyStyledText,
  Modal,
  ProtocolDeck,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import {
  getGripperDisplayName,
  getModuleType,
  getSimplestDeckConfigForProtocol,
  MAGNETIC_BLOCK_TYPE,
  parseInitialLoadedModulesBySlot,
  parseInitialPipetteNamesByMount,
} from '@opentrons/shared-data'

import { getTopPortalEl } from '/app/App/portal'
import { ChooseRobotToRunProtocolSlideout } from '/app/organisms/Desktop/ChooseRobotToRunProtocolSlideout'
import { useFeatureFlag } from '/app/redux/config'
import {
  analyzeProtocol,
  getIsProtocolAnalysisInProgress,
} from '/app/redux/protocol-storage'
import { getAnalysisStatus } from '/app/transformations/analysis'
import { getProtocolUsesGripper } from '/app/transformations/commands'
import { getProtocolDisplayName } from '/app/transformations/protocols'

import { ProtocolAnalysisFailure } from '../ProtocolAnalysisFailure'
import { SendProtocolToFlexSlideout } from '../SendProtocolToFlexSlideout'
import { AnnotatedSteps } from './AnnotatedSteps'
import { ProtocolDetailsHeader } from './ProtocolDetailsHeader'
import { ProtocolDetailsTabs } from './ProtocolDetailsTabs'
import { ProtocolLabwareDetails } from './ProtocolLabwareDetails'
import { ProtocolLiquidsDetails } from './ProtocolLiquidsDetails'
import { ProtocolParameters } from './ProtocolParameters'
import { ProtocolStats } from './ProtocolStats'
import { RobotConfigurationDetails } from './RobotConfigurationDetails'

import type {
  GroupedCommands,
  StoredProtocolData,
} from '/app/redux/protocol-storage'
import type { Dispatch, State } from '/app/redux/types'

const ZOOM_ICON_STYLE = css`
  border-radius: ${BORDERS.borderRadius4};
  &:hover {
    background: ${COLORS.grey30};
  }
  &:active {
    background: ${COLORS.grey35};
  }
  &:disabled {
    background: ${COLORS.white};
  }
  &:focus-visible {
    background: ${COLORS.grey35};
  }
`
interface ProtocolDetailsProps extends StoredProtocolData {
  groupedCommands: GroupedCommands | null
}

export type ProtocolDetailsTab =
  'robot_config' | 'labware' | 'liquids' | 'stats' | 'parameters'

export function ProtocolDetailsContents(
  props: ProtocolDetailsProps
): JSX.Element | null {
  const dispatch = useDispatch<Dispatch>()
  const {
    protocolKey,
    srcFileNames,
    mostRecentAnalysis,
    modified,
    groupedCommands,
  } = props
  const { t } = useTranslation('protocol_details')
  const enableProtocolStats = useFeatureFlag('protocolStats')
  const runTimeParameters = mostRecentAnalysis?.runTimeParameters ?? []
  const hasRunTimeParameters = runTimeParameters.length > 0
  const [currentTab, setCurrentTab] = useState<ProtocolDetailsTab>(
    hasRunTimeParameters ? 'parameters' : 'robot_config'
  )
  const [
    showChooseRobotToRunProtocolSlideout,
    setShowChooseRobotToRunProtocolSlideout,
  ] = useState<boolean>(false)
  const [showSendProtocolToFlexSlideout, setShowSendProtocolToFlexSlideout] =
    useState<boolean>(false)
  const [showDeckViewModal, setShowDeckViewModal] = useState(false)

  const isAnalyzing = useSelector((state: State) =>
    getIsProtocolAnalysisInProgress(state, protocolKey)
  )

  const analysisStatus = getAnalysisStatus(isAnalyzing, mostRecentAnalysis)

  if (analysisStatus === 'stale') {
    dispatch(analyzeProtocol(protocolKey))
  } else if (analysisStatus === 'missing') return null

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
      ? map(
          parseInitialLoadedModulesBySlot(mostRecentAnalysis.commands)
        ).filter(
          loadedModule =>
            // filter out magnetic block which is already handled by the required fixture details
            getModuleType(loadedModule.params.model) !== MAGNETIC_BLOCK_TYPE
        )
      : []

  const requiredFixtureDetails = getSimplestDeckConfigForProtocol(
    analysisStatus !== 'stale' && analysisStatus !== 'loading'
      ? mostRecentAnalysis
      : null
  )

  const protocolDisplayName = getProtocolDisplayName(
    protocolKey,
    srcFileNames,
    mostRecentAnalysis
  )

  const robotType = mostRecentAnalysis?.robotType ?? null

  const contentsByTabName = {
    labware: (
      <ProtocolLabwareDetails commands={mostRecentAnalysis?.commands ?? []} />
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
    timeline:
      mostRecentAnalysis != null ? (
        <AnnotatedSteps
          analysis={mostRecentAnalysis}
          groupedCommands={groupedCommands}
        />
      ) : null,
    parameters: <ProtocolParameters runTimeParameters={runTimeParameters} />,
  }

  const deckMap = <ProtocolDeck protocolAnalysis={mostRecentAnalysis} />

  const deckViewByAnalysisStatus = {
    stale: <Box size="14rem" backgroundColor={COLORS.grey30} />,
    missing: <Box size="14rem" backgroundColor={COLORS.grey30} />,
    loading: <Box size="14rem" backgroundColor={COLORS.grey30} />,
    error: <Box size="14rem" backgroundColor={COLORS.grey30} />,
    parameterRequired: <Box size="14rem" backgroundColor={COLORS.grey30} />,
    complete: (
      <Box size="14rem" height="auto">
        {deckMap}
      </Box>
    ),
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
      {showDeckViewModal
        ? createPortal(
            <Modal
              title={t('deck_view')}
              onClose={() => {
                setShowDeckViewModal(false)
              }}
            >
              {deckMap}
            </Modal>,
            getTopPortalEl()
          )
        : null}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        padding={SPACING.spacing16}
        width="100%"
      >
        <ErrorBoundary fallback={UnknownAttachmentError}>
          <ChooseRobotToRunProtocolSlideout
            onCloseClick={() => {
              setShowChooseRobotToRunProtocolSlideout(false)
            }}
            showSlideout={showChooseRobotToRunProtocolSlideout}
            storedProtocolData={props}
          />
          <SendProtocolToFlexSlideout
            isExpanded={showSendProtocolToFlexSlideout}
            onCloseClick={() => {
              setShowSendProtocolToFlexSlideout(false)
            }}
            storedProtocolData={props}
          />
          <ProtocolDetailsHeader
            analysisStatus={analysisStatus}
            mostRecentAnalysis={mostRecentAnalysis}
            protocolKey={protocolKey}
            protocolDisplayName={protocolDisplayName}
            robotType={robotType}
            modified={modified}
            props={props}
            setShowChooseRobotToRunProtocolSlideout={
              setShowChooseRobotToRunProtocolSlideout
            }
            setShowSendProtocolToFlexSlideout={
              setShowSendProtocolToFlexSlideout
            }
          />

          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing12}
            paddingBottom={SPACING.spacing16}
          >
            <ProtocolDetailsTabs
              mostRecentAnalysis={mostRecentAnalysis}
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
            />
            <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing10}>
              <Flex
                flex="0 0 16rem"
                flexDirection={DIRECTION_COLUMN}
                backgroundColor={COLORS.white}
                borderRadius={BORDERS.borderRadius8}
                height="100%"
                data-testid="ProtocolDetails_deckMap"
              >
                <Flex
                  alignItems={ALIGN_CENTER}
                  justifyContent={JUSTIFY_SPACE_BETWEEN}
                  padding={SPACING.spacing16}
                >
                  <LegacyStyledText
                    forwardedAs="h3"
                    fontWeight={TYPOGRAPHY.fontWeightSemiBold}
                  >
                    {t('deck_view')}
                  </LegacyStyledText>
                  <Btn
                    alignItems={ALIGN_CENTER}
                    disabled={analysisStatus !== 'complete'}
                    display={DISPLAY_FLEX}
                    justifyContent={JUSTIFY_CENTER}
                    height={SPACING.spacing24}
                    width={SPACING.spacing24}
                    css={ZOOM_ICON_STYLE}
                    onClick={() => {
                      setShowDeckViewModal(true)
                    }}
                  >
                    <Icon
                      name="union"
                      size="1rem"
                      color={
                        analysisStatus !== 'complete'
                          ? COLORS.grey40
                          : COLORS.grey60
                      }
                    />
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
                gridGap={SPACING.spacing8}
              >
                <Box
                  backgroundColor={COLORS.white}
                  borderRadius={BORDERS.borderRadius8}
                  padding={SPACING.spacing16}
                >
                  {contentsByTabName[currentTab]}
                </Box>
              </Flex>
            </Flex>
          </Flex>
        </ErrorBoundary>
      </Flex>
    </>
  )
}
