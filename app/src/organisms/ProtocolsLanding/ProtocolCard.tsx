import * as React from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { css } from 'styled-components'

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
  SIZE_4,
  ModuleIcon,
  POSITION_ABSOLUTE,
  BORDERS,
  TYPOGRAPHY,
  WRAP,
  ALIGN_START,
  JUSTIFY_FLEX_END,
  FLEX_NONE,
} from '@opentrons/components'

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

// TODO kj 07/06/2022: Currently, using hardcoded number to align elements
// This should be removed in the future
const PROTOCOL_CARD_BREAKPOINT = '800px'

const PROTOCOL_CARD_ALIGN_ITEMS_STYLING = css`
  align-items: ${ALIGN_START};

  @media (min-width: ${PROTOCOL_CARD_BREAKPOINT}) {
    align-items: ${ALIGN_CENTER};
  }
`

const PROTOCOL_CARD_UPDATED_JUSTIFY_CONTENT_STYLING = css`
  justify-content: ${JUSTIFY_FLEX_END};

  @media (min-width: ${PROTOCOL_CARD_BREAKPOINT}) {
    justify-content: ${FLEX_NONE};
  }
`

export function ProtocolCard(props: ProtocolCardProps): JSX.Element | null {
  const history = useHistory()
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
    <Flex
      backgroundColor={COLORS.white}
      border={`1px solid ${COLORS.medGreyEnabled}`}
      borderRadius="4px"
      flexDirection={DIRECTION_ROW}
      marginBottom={SPACING.spacing2}
      padding={SPACING.spacing4}
      justifyContent={JUSTIFY_SPACE_BETWEEN}
      width="100%"
      position="relative"
      cursor="pointer"
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
        top={SPACING.spacing2}
        right={SPACING.spacing2}
      >
        <ProtocolOverflowMenu
          protocolKey={protocolKey}
          handleRunProtocol={handleRunProtocol}
        />
      </Box>
    </Flex>
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
  const requiredModuleTypes = parseAllRequiredModuleModels(
    mostRecentAnalysis != null ? mostRecentAnalysis.commands : []
  ).map(getModuleType)

  return (
    <Flex flex="1">
      <Flex
        marginRight={SPACING.spacing4}
        size="6rem"
        height="auto"
        justifyContent={JUSTIFY_CENTER}
        css={PROTOCOL_CARD_ALIGN_ITEMS_STYLING}
        data-testid={`ProtocolCard_deckLayout_${protocolDisplayName}`}
      >
        {
          {
            missing: <Icon name="ot-spinner" spin size={SIZE_4} />,
            loading: <Icon name="ot-spinner" spin size={SIZE_4} />,
            error: <Box size="6rem" backgroundColor={COLORS.medGreyEnabled} />,
            complete: (
              <DeckThumbnail commands={mostRecentAnalysis?.commands ?? []} />
            ),
          }[analysisStatus]
        }
      </Flex>
      <Flex flex="1" flexDirection={DIRECTION_COLUMN}>
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
            <StyledText as="p" flex="1" color={COLORS.darkGreyEnabled}>
              {t('loading_data')}
            </StyledText>
          ) : (
            <Flex flexWrap={WRAP}>
              {/* TODO: kj 07/01/2022 for 6.1 we need to user flex-wrap */}
              <Flex
                flex="1"
                flexDirection={DIRECTION_COLUMN}
                marginRight={SPACING.spacing4}
                data-testid={`ProtocolCard_leftMount_${protocolDisplayName}`}
                minWidth="10.625rem"
              >
                <StyledText
                  as="h6"
                  marginTop={SPACING.spacing3}
                  marginBottom={SPACING.spacing2}
                  color={COLORS.darkGreyEnabled}
                >
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
                          : t('shared:not_used'),
                    }[analysisStatus]
                  }
                </StyledText>
              </Flex>
              <Flex
                flex="1"
                flexDirection={DIRECTION_COLUMN}
                marginRight={SPACING.spacing4}
                data-testid={`ProtocolCard_rightMount_${protocolDisplayName}`}
                minWidth="10.625rem"
              >
                <StyledText
                  as="h6"
                  marginTop={SPACING.spacing3}
                  marginBottom={SPACING.spacing2}
                  color={COLORS.darkGreyEnabled}
                >
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
                          : t('shared:not_used'),
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
                    <StyledText
                      as="h6"
                      marginTop={SPACING.spacing3}
                      marginBottom={SPACING.spacing2}
                      color={COLORS.darkGreyEnabled}
                    >
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
            </Flex>
          )}
          <Flex
            flex="0 0 8rem"
            flexDirection={DIRECTION_COLUMN}
            data-testid={`ProtocolCard_date_${protocolDisplayName}`}
            marginTop={SPACING.spacing3}
            css={PROTOCOL_CARD_UPDATED_JUSTIFY_CONTENT_STYLING}
          >
            <StyledText
              as="label"
              marginBottom={SPACING.spacing3}
              color={COLORS.darkGreyEnabled}
              textAlign={TYPOGRAPHY.textAlignRight}
            >
              {t('updated')}
            </StyledText>
            <StyledText
              as="label"
              color={COLORS.darkGreyEnabled}
              textAlign={TYPOGRAPHY.textAlignRight}
            >
              {format(new Date(modified), 'MM/dd/yy HH:mm:ss')}
            </StyledText>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
