import * as React from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import {
  getModuleType,
  getPipetteNameSpecs,
  ProtocolAnalysisOutput,
} from '@opentrons/shared-data'

import {
  Box,
  Flex,
  Icon,
  DIRECTION_ROW,
  COLORS,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  SIZE_3,
  ModuleIcon,
  POSITION_ABSOLUTE,
} from '@opentrons/components'
import { Link } from 'react-router-dom'
import {
  parseInitialPipetteNamesByMount,
  parseAllRequiredModuleModels,
} from '@opentrons/api-client'

import { getIsProtocolAnalysisInProgress } from '../../redux/protocol-storage'
import { StyledText } from '../../atoms/text'
import { DeckThumbnail } from '../../molecules/DeckThumbnail'
import { ProtocolOverflowMenu } from './ProtocolOverflowMenu'
import { ProtocolAnalysisFailure } from '../ProtocolAnalysisFailure'
import { getAnalysisStatus, getProtocolDisplayName } from './utils'

import type { StoredProtocolData } from '../../redux/protocol-storage'
import type { State } from '../../redux/types'

interface ProtocolCardProps extends StoredProtocolData {
  handleRunProtocol: () => void
}

export function ProtocolCard(props: ProtocolCardProps): JSX.Element | null {
  const {
    handleRunProtocol,
    protocolKey,
    srcFileNames,
    mostRecentAnalysis,
    modified,
  } = props

  const isAnalyzing = useSelector((state: State) =>
    getIsProtocolAnalysisInProgress(state, protocolKey)
  )
  const protocolDisplayName = getProtocolDisplayName(
    protocolKey,
    srcFileNames,
    mostRecentAnalysis
  )

  return (
    <Link to={`/protocols/${protocolKey}`} style={{ color: 'inherit' }}>
      <Flex
        backgroundColor={COLORS.white}
        border={`1px solid ${COLORS.medGrey}`}
        borderRadius="4px"
        flexDirection={DIRECTION_ROW}
        marginBottom={SPACING.spacing3}
        padding={SPACING.spacing4}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        width="100%"
        position="relative"
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
          top={SPACING.spacing2}
          right={SPACING.spacing2}
        >
          <ProtocolOverflowMenu
            protocolKey={protocolKey}
            handleRunProtocol={handleRunProtocol}
          />
        </Box>
      </Flex>
    </Link>
  )
}

interface AnalysisInfoProps {
  protocolKey: string
  protocolDisplayName: string
  modified: number
  isAnalyzing: boolean
  mostRecentAnalysis?: ProtocolAnalysisOutput
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
  const requiredModuleTypes = parseAllRequiredModuleModels(
    mostRecentAnalysis != null ? mostRecentAnalysis.commands : []
  ).map(getModuleType)

  return (
    <Flex flex="1">
      <Flex
        marginRight={SPACING.spacing4}
        size="6rem"
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
        data-testid={`ProtocolCard_deckLayout_${protocolDisplayName}`}
      >
        {
          {
            missing: <Icon name="ot-spinner" spin size={SIZE_3} />,
            loading: <Icon name="ot-spinner" spin size={SIZE_3} />,
            error: <Box size="6rem" backgroundColor={COLORS.medGrey} />,
            complete: (
              <DeckThumbnail commands={mostRecentAnalysis?.commands ?? []} />
            ),
          }[analysisStatus]
        }
      </Flex>
      <Flex
        flex="1"
        flexDirection={DIRECTION_COLUMN}
        marginRight={SPACING.spacing4}
      >
        {analysisStatus === 'error' ? (
          <ProtocolAnalysisFailure
            protocolKey={protocolKey}
            errors={mostRecentAnalysis?.errors.map(e => e.detail) ?? []}
          />
        ) : null}
        <StyledText
          as="h3"
          marginBottom={SPACING.spacing4}
          data-testid={`ProtocolCard_${protocolDisplayName}`}
        >
          {protocolDisplayName}
        </StyledText>
        <Flex justifyContent={JUSTIFY_SPACE_BETWEEN}>
          {analysisStatus === 'loading' ? (
            <StyledText as="p" flex="1">
              {t('loading_data')}
            </StyledText>
          ) : (
            <>
              <Flex
                flex="1"
                flexDirection={DIRECTION_COLUMN}
                marginRight={SPACING.spacing4}
                data-testid={`ProtocolCard_leftMount_${protocolDisplayName}`}
              >
                <StyledText as="h6" marginBottom={SPACING.spacing3}>
                  {t('left_mount')}
                </StyledText>
                <StyledText as="p">
                  {
                    {
                      missing: t('no_data'),
                      loading: t('no_data'),
                      error: t('no_data'),
                      complete:
                        leftMountPipetteName != null
                          ? getPipetteNameSpecs(leftMountPipetteName)
                              ?.displayName
                          : t('not_used'),
                    }[analysisStatus]
                  }
                </StyledText>
              </Flex>
              <Flex
                flex="1"
                flexDirection={DIRECTION_COLUMN}
                marginRight={SPACING.spacing4}
                data-testid={`ProtocolCard_rightMount_${protocolDisplayName}`}
              >
                <StyledText as="h6" marginBottom={SPACING.spacing3}>
                  {t('right_mount')}
                </StyledText>
                <StyledText as="p">
                  {
                    {
                      missing: t('no_data'),
                      loading: t('no_data'),
                      error: t('no_data'),
                      complete:
                        rightMountPipetteName != null
                          ? getPipetteNameSpecs(rightMountPipetteName)
                              ?.displayName
                          : t('not_used'),
                    }[analysisStatus]
                  }
                </StyledText>
              </Flex>
              <Flex
                flex="1"
                flexDirection={DIRECTION_COLUMN}
                marginRight={SPACING.spacing4}
              >
                {requiredModuleTypes.length > 0 ? (
                  <>
                    <StyledText as="h6" marginBottom={SPACING.spacing3}>
                      {t('modules')}
                    </StyledText>
                    <Flex>
                      {requiredModuleTypes.map((moduleType, index) => (
                        <ModuleIcon
                          key={index}
                          moduleType={moduleType}
                          height="1rem"
                          marginRight={SPACING.spacing3}
                        />
                      ))}
                    </Flex>
                  </>
                ) : null}
              </Flex>
            </>
          )}
          <Flex
            flex="0 0 8rem"
            flexDirection={DIRECTION_COLUMN}
            marginRight={SPACING.spacing4}
            data-testid={`ProtocolCard_date_${protocolDisplayName}`}
          >
            <StyledText as="h6" marginBottom={SPACING.spacing3}>
              {t('updated')}
            </StyledText>
            <StyledText as="p">
              {format(new Date(modified), 'MM/dd/yy HH:mm:ss')}
            </StyledText>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
