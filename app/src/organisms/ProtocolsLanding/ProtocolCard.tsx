import * as React from 'react'
import { css } from 'styled-components'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'

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

import type { PipetteName } from '@opentrons/shared-data'

interface ProtocolCardProps {
  protocolName: string
  protocolKey: string
  robotModel: string
  leftMountPipetteName: PipetteName | null
  rightMountPipetteName: PipetteName | null
  requiredModuleTypes: string[]
  lastUpdated: number
}

export function ProtocolCard(props: ProtocolCardProps): JSX.Element | null {
  const { t } = useTranslation('protocol_list')
  const {
    protocolName,
    protocolKey,
    robotModel,
    leftMountPipetteName,
    rightMountPipetteName,
    requiredModuleTypes,
    lastUpdated,
  } = props

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
            date: format(new Date(lastUpdated), 'M/d/yyyy'),
          })}
        </StyledText>
      </Flex>
    </Link>
  )
}
