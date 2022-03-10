import * as React from 'react'
import path from 'path'
import { css } from 'styled-components'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import first from 'lodash/first'
import map from 'lodash/map'
import { getModuleType, schemaV6Adapter } from '@opentrons/shared-data'
import { readJson } from 'fsextra'

import {
  Box,
  Flex,
  DIRECTION_ROW,
  COLORS,
  SPACING,
} from '@opentrons/components'
import { Link } from 'react-router-dom'

import { StyledText } from '../../atoms/text'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'
import { ModuleIcon } from '../../molecules/ModuleIcon'

import { StoredProtocolData } from '../../redux/protocol-storage'
import type { ProtocolFile } from '@opentrons/shared-data'

type ProtocolCardProps = StoredProtocolData

export function ProtocolCard(props: ProtocolCardProps): JSX.Element | null {
  const { t } = useTranslation('protocol_list')
  const { protocolKey, srcFileNames, mostRecentAnalysis, modified } = props

  const [
    protocolData,
    setProtocolData,
  ] = React.useState<ProtocolFile<{}> | null>(null)

  React.useEffect(() => {
    if (mostRecentAnalysis != null) {
      setProtocolData(schemaV6Adapter(JSON.parse(mostRecentAnalysis)?.analyses[0]))
    }
  }, [modified])

  const { metadata, robot, pipettes, commands, modules } = protocolData ?? {}

  const robotModel = robot?.model
  const leftMountPipetteName =
    pipettes != null
      ? pipettes[
          Object.keys(pipettes ?? {}).find(pipetteId => {
            return commands?.find(
              command =>
                command.commandType === 'loadPipette' &&
                command.result.pipetteId === pipetteId &&
                command.params.mount === 'left'
            )
          }) ?? ''
        ]?.name ?? ''
      : ''
  const rightMountPipetteName =
    pipettes != null
      ? pipettes[
          Object.keys(pipettes ?? {}).find(pipetteId => {
            commands?.find(
              command =>
                command.commandType === 'loadPipette' &&
                command.params.pipetteId === pipetteId &&
                command.params.mount === 'right'
            )
          }) ?? ''
        ]?.name ?? ''
      : ''
  const requiredModuleTypes = map(modules, ({ model }, moduleId) =>
    getModuleType(model)
  )

  const protocolName =
    metadata?.protocolName ?? first(srcFileNames) ?? protocolKey

  return (
    <Link to={`/protocols/${protocolKey}`}>
      <Flex
        backgroundColor={COLORS.white}
        border={`1px solid ${COLORS.medGrey}`}
        borderRadius="4px"
        flexDirection={DIRECTION_ROW}
        marginBottom={SPACING.spacing3}
        padding={SPACING.spacing4}
        width="100%"
        position="relative"
      >
        <Box
          flex="0 0 96px"
          height="86px"
          backgroundColor={COLORS.medGrey}
          marginRight={SPACING.spacing4}
        >
          DECKMAP TODO
        </Box>
        <Box>
          <StyledText as="h3" marginBottom={SPACING.spacing4} height="2.75rem">
            {protocolName}
          </StyledText>
          <Flex>
            <Flex flexDirection="column" marginRight={SPACING.spacing4}>
              <StyledText as="h6">robot</StyledText>
              <StyledText as="p">{robotModel}</StyledText>
            </Flex>
            <Flex flexDirection="column" marginRight={SPACING.spacing4}>
              <StyledText as="h6">left mount</StyledText>
              <StyledText as="p">{leftMountPipetteName}</StyledText>
            </Flex>
            <Flex flexDirection="column" marginRight={SPACING.spacing4}>
              <StyledText as="h6">right mount</StyledText>
              <StyledText as="p">{rightMountPipetteName}</StyledText>
            </Flex>
            <Flex flexDirection="column" marginRight={SPACING.spacing4}>
              <StyledText as="h6">modules</StyledText>
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
          </Flex>

          <OverflowBtn
            css={css`
              position: absolute;
              top: 2px;
              right: 2px;
            `}
          />
        </Box>
        <StyledText as="label" position="absolute" bottom="1rem" right="1rem">
          {t('last_updated_at', {
            date: format(new Date(modified), 'M/d/yyyy'),
          })}
        </StyledText>
      </Flex>
    </Link>
  )
}
