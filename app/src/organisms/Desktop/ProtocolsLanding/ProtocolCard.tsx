import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'

import {
  getModuleType,
  getPipetteNameSpecs,
  FLEX_STANDARD_MODEL,
  getGripperDisplayName,
  parseAllRequiredModuleModels,
  parseInitialPipetteNamesByMount,
} from '@opentrons/shared-data'
import {
  ALIGN_FLEX_START,
  BORDERS,
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  ModuleIcon,
  OVERFLOW_WRAP_ANYWHERE,
  POSITION_ABSOLUTE,
  ProtocolDeck,
  SIZE_2,
  SIZE_3,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
  WRAP,
} from '@opentrons/components'

import { getIsProtocolAnalysisInProgress } from '/app/redux/protocol-storage'
import { InstrumentContainer } from '/app/atoms/InstrumentContainer'
import { ProtocolOverflowMenu } from './ProtocolOverflowMenu'
import { ProtocolAnalysisFailure } from '../ProtocolAnalysisFailure'
import { ProtocolStatusBanner } from '../ProtocolStatusBanner'
import { getProtocolUsesGripper } from '/app/transformations/commands'
import { ProtocolAnalysisStale } from '../ProtocolAnalysisFailure/ProtocolAnalysisStale'
import { getRobotTypeDisplayName } from './utils'
import { getAnalysisStatus } from '/app/transformations/analysis'
import { getProtocolDisplayName } from '/app/transformations/protocols'

import type { ProtocolAnalysisOutput } from '@opentrons/shared-data'
import type { StoredProtocolData } from '/app/redux/protocol-storage'
import type { State } from '/app/redux/types'

interface ProtocolCardProps {
  handleRunProtocol: (storedProtocolData: StoredProtocolData) => void
  handleSendProtocolToFlex: (storedProtocolData: StoredProtocolData) => void
  storedProtocolData: StoredProtocolData
}
export function ProtocolCard(props: ProtocolCardProps): JSX.Element | null {
  const navigate = useNavigate()
  const {
    handleRunProtocol,
    handleSendProtocolToFlex,
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
    <Box
      backgroundColor={COLORS.white}
      borderRadius={BORDERS.borderRadius8}
      cursor="pointer"
      minWidth="36rem"
      padding={SPACING.spacing16}
      position="relative"
      onClick={() => {
        navigate(`/protocols/${protocolKey}`)
      }}
    >
      <ErrorBoundary fallback={UnknownAttachmentError}>
        <AnalysisInfo
          protocolKey={protocolKey}
          mostRecentAnalysis={mostRecentAnalysis}
          protocolDisplayName={protocolDisplayName}
          isAnalyzing={isAnalyzing}
          modified={modified}
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
            missing: (
              <Icon
                name="ot-spinner"
                color={COLORS.grey60}
                spin
                size={SIZE_3}
              />
            ),
            loading: (
              <Icon
                name="ot-spinner"
                color={COLORS.grey60}
                spin
                size={SIZE_3}
              />
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
              mostRecentAnalysis != null ? (
                <ProtocolDeck protocolAnalysis={mostRecentAnalysis} />
              ) : (
                <Box size="6rem" backgroundColor={COLORS.grey30} />
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
          {analysisStatus === 'error' ? (
            <ProtocolAnalysisFailure
              protocolKey={protocolKey}
              errors={mostRecentAnalysis?.errors.map(e => e.detail) ?? []}
            />
          ) : null}
          {analysisStatus === 'stale' ? (
            <ProtocolAnalysisStale protocolKey={protocolKey} />
          ) : null}
          <LegacyStyledText
            as="h3"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            data-testid={`ProtocolCard_${protocolDisplayName}`}
            overflowWrap={OVERFLOW_WRAP_ANYWHERE}
          >
            {protocolDisplayName}
          </LegacyStyledText>
        </Flex>
        {/* data section */}
        {analysisStatus === 'loading' ? (
          <LegacyStyledText as="p" flex="1" color={COLORS.grey60}>
            {t('loading_data')}
          </LegacyStyledText>
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
                <LegacyStyledText as="h6" color={COLORS.grey60}>
                  {t('robot')}
                </LegacyStyledText>
                <LegacyStyledText as="p">
                  {getRobotTypeDisplayName(robotType)}
                </LegacyStyledText>
              </Flex>
              <Flex
                flex="1"
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing4}
                data-testid={`ProtocolCard_instruments_${protocolDisplayName}`}
                minWidth="10.625rem"
              >
                <LegacyStyledText as="h6" color={COLORS.grey60}>
                  {t('shared:instruments')}
                </LegacyStyledText>
                {
                  {
                    missing: (
                      <LegacyStyledText as="p">{t('no_data')}</LegacyStyledText>
                    ),
                    loading: (
                      <LegacyStyledText as="p">{t('no_data')}</LegacyStyledText>
                    ),
                    error: (
                      <LegacyStyledText as="p">{t('no_data')}</LegacyStyledText>
                    ),
                    parameterRequired: (
                      <LegacyStyledText as="p">{t('no_data')}</LegacyStyledText>
                    ),
                    stale: (
                      <LegacyStyledText as="p">{t('no_data')}</LegacyStyledText>
                    ),
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
                    <LegacyStyledText as="h6" color={COLORS.grey60}>
                      {t('modules')}
                    </LegacyStyledText>
                    <Flex>
                      {requiredModuleTypes.map((moduleType, index) => (
                        <ModuleIcon
                          key={index}
                          color={COLORS.grey60}
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
              <LegacyStyledText as="label" color={COLORS.grey60}>
                {`${t('updated')} ${format(
                  new Date(modified),
                  'M/d/yy HH:mm'
                )}`}
              </LegacyStyledText>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
