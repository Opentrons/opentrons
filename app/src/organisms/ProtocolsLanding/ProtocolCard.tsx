import * as React from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import first from 'lodash/first'
import {
  getModuleType,
  getPipetteNameSpecs,
  ProtocolAnalysisFile,
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

import { StoredProtocolData } from '../../redux/protocol-storage'
import { StyledText } from '../../atoms/text'
import { DeckThumbnail } from '../../molecules/DeckThumbnail'
import { ProtocolOverflowMenu } from './ProtocolOverflowMenu'
import { Banner } from '../../atoms/Banner'

interface ProtocolCardProps extends StoredProtocolData {
  handleRunProtocol: () => void
}

export function ProtocolCard(props: ProtocolCardProps): JSX.Element | null {
  const { t } = useTranslation('protocol_list')
  const {
    handleRunProtocol,
    protocolKey,
    srcFileNames,
    mostRecentAnalysis,
    modified,
  } = props

  const protocolDisplayName =
    mostRecentAnalysis?.metadata?.protocolName ??
    first(srcFileNames) ??
    protocolKey

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
        {mostRecentAnalysis != null ? (
          <AnalysisInfo
            mostRecentAnalysis={mostRecentAnalysis}
            protocolDisplayName={protocolDisplayName}
            modified={modified}
          />
        ) : (
          <StyledText as="p">{t('loading_data')}</StyledText>
        )}
        <Box position={POSITION_ABSOLUTE} top={SPACING.spacing2} right={SPACING.spacing2}>
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
  protocolDisplayName: string
  modified: number
  mostRecentAnalysis: ProtocolAnalysisFile<{}>
}
function AnalysisInfo(props: AnalysisInfoProps): JSX.Element {
  const { protocolDisplayName, mostRecentAnalysis, modified } = props
  const { t } = useTranslation(['protocol_list', 'shared'])
  const {
    left: leftMountPipetteName,
    right: rightMountPipetteName,
  } = parseInitialPipetteNamesByMount(mostRecentAnalysis)
  const requiredModuleTypes = parseAllRequiredModuleModels(
    mostRecentAnalysis
  ).map(getModuleType)

  return (
    <Flex flex="1">
      <Flex
        marginRight={SPACING.spacing4}
        size="6rem"
        justifyContent={JUSTIFY_CENTER}
        alignItems={ALIGN_CENTER}
      >
        {mostRecentAnalysis != null ? (
          <DeckThumbnail analysis={mostRecentAnalysis} />
        ) : (
          <Icon name="ot-spinner" spin size={SIZE_3} />
        )}
      </Flex>
      <Flex
        flex="1"
        flexDirection={DIRECTION_COLUMN}
        marginRight={SPACING.spacing4}
      >
        <Banner type="error">{t('protocol_analysis_failure')}</Banner>
        <StyledText as="h3" marginBottom={SPACING.spacing4} height="2.75rem">
          {protocolDisplayName}
        </StyledText>
        <Flex>
          <Flex flexDirection={DIRECTION_COLUMN} marginRight={SPACING.spacing4}>
            <StyledText as="h6">{t('left_mount')}</StyledText>
            <StyledText as="p">
              {leftMountPipetteName != null
                ? getPipetteNameSpecs(leftMountPipetteName)?.displayName
                : t('empty')}
            </StyledText>
          </Flex>
          <Flex flexDirection={DIRECTION_COLUMN} marginRight={SPACING.spacing4}>
            <StyledText as="h6">{t('right_mount')}</StyledText>
            <StyledText as="p">
              {rightMountPipetteName != null
                ? getPipetteNameSpecs(rightMountPipetteName)?.displayName
                : t('empty')}
            </StyledText>
          </Flex>
          {requiredModuleTypes.length > 0 ? (
            <Flex
              flexDirection={DIRECTION_COLUMN}
              marginRight={SPACING.spacing4}
            >
              <StyledText as="h6">{t('modules')}</StyledText>
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
            </Flex>
          ) : null}
          <Flex flexDirection={DIRECTION_COLUMN} marginRight={SPACING.spacing4}>
            <StyledText as="h6">{t('updated')}</StyledText>
            <StyledText as="label">
              {format(new Date(modified), 'MM/dd/yy HH:mm:ss')}
            </StyledText>
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
