import * as React from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import first from 'lodash/first'
import map from 'lodash/map'
import {
  getModuleType,
  getPipetteNameSpecs,
  schemaV6Adapter,
} from '@opentrons/shared-data'

import {
  Box,
  Flex,
  DIRECTION_ROW,
  COLORS,
  SPACING,
  JUSTIFY_SPACE_BETWEEN,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { Link } from 'react-router-dom'

import { StyledText } from '../../atoms/text'
import { ModuleIcon } from '../../molecules/ModuleIcon'
import { ProtocolOverflowMenu } from './ProtocolOverflowMenu'

import { StoredProtocolData } from '../../redux/protocol-storage'
import type { ProtocolAnalysisFile } from '@opentrons/shared-data'
import { ProtocolOverflowMenu } from './ProtocolOverflowMenu'
import { parseInitialPipetteNamesByMount, parseAllRequiredModuleModels, parseInitialLoadedLabwareBySlot } from '@opentrons/api-client'

type ProtocolCardProps = StoredProtocolData

export function ProtocolCard(props: ProtocolCardProps): JSX.Element | null {
  const { t } = useTranslation('protocol_list')
  const { protocolKey, srcFileNames, mostRecentAnalysis, modified } = props

  const [
    protocolData,
    setProtocolData,
  ] = React.useState<ProtocolAnalysisFile<{}> | null>(null)

  React.useEffect(() => {
    if (mostRecentAnalysis != null) {
      setProtocolData(
        schemaV6Adapter(JSON.parse(mostRecentAnalysis)?.analyses[0])
      )
    }
  }, [modified])

  const { metadata, robot, pipettes, commands, modules } = protocolData ?? {}

  // TODO: IMMEDIATELY clean up and move these protocol data selectors into api_client as
  // pure functions of RunTimeCommand[]
  const robotModel = robot?.model ?? 'OT-2'
  const { left: leftMountPipetteName, right: rightMountPipetteName } =
    protocolData != null ? parseInitialPipetteNamesByMount(protocolData) : {}
  const requiredModuleTypes = protocolData != null ? parseAllRequiredModuleModels(protocolData).map(getModuleType) : []
  const initialLoadedLabwareBySlot = protocolData != null ? parseInitialLoadedLabwareBySlot(protocolData) : {}
  console.log('init ', initialLoadedLabwareBySlot)

  const protocolName =
    metadata?.protocolName ?? first(srcFileNames) ?? protocolKey

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
        <Flex>
          <Box
            flex="0 0 96px"
            height="86px"
            backgroundColor={COLORS.medGrey}
            marginRight={SPACING.spacing4}
          >
            DECKMAP TODO
          </Box>
          <Flex flexDirection={DIRECTION_COLUMN} marginRight={SPACING.spacing4}>
            <StyledText
              as="h3"
              marginBottom={SPACING.spacing4}
              height="2.75rem"
            >
              {protocolName}
            </StyledText>
            <Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                marginRight={SPACING.spacing4}
              >
                <StyledText as="h6">{t('robot')}</StyledText>
                <StyledText as="p">{robotModel}</StyledText>
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                marginRight={SPACING.spacing4}
              >
                <StyledText as="h6">{t('left_mount')}</StyledText>
                <StyledText as="p">
                  {leftMountPipetteName != null
                    ? getPipetteNameSpecs(leftMountPipetteName)?.displayName
                    : t('empty')}
                </StyledText>
              </Flex>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                marginRight={SPACING.spacing4}
              >
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
            </Flex>
          </Flex>
        </Flex>

        <Flex flexDirection={DIRECTION_COLUMN}>
          <ProtocolOverflowMenu protocolKey={protocolKey} />
          <StyledText
            as="label"
            position="absolute"
            bottom={SPACING.spacing4}
            right={SPACING.spacing4}
          >
            {t('last_updated_at', {
              date: format(new Date(modified), 'MMMM dd, yyyy HH:mm'),
            })}
          </StyledText>
        </Flex>
      </Flex>
    </Link>
  )
}
