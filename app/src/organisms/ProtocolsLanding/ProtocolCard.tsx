import * as React from 'react'
import { css } from 'styled-components'
// import { useTranslation } from 'react-i18next'

import { StyledText } from '../../atoms/text'
import { OverflowBtn } from '../../atoms/MenuList/OverflowBtn'

import {
  Box,
  Flex,
  Icon,
  DIRECTION_ROW,
  COLORS,
  SPACING,
} from '@opentrons/components'

// TODO (ka 2/11/22) this is a temp wrokaround until we get actual protocol data
interface ProtocolCardProps {
  protocolName?: string | null
  robotModel?: string | null
  leftMount?: string | null
  rightMount?: string | null
  modules?: string[] | null
  lastUpdated?: number | null
}

export function ProtocolCard(props: ProtocolCardProps): JSX.Element | null {
  return (
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
          QIAseq Targeted RNAscan Panel
        </StyledText>
        <Flex>
          <Flex flexDirection="column" marginRight={SPACING.spacing4}>
            <StyledText as="h6">robot</StyledText>
            <StyledText as="p">OT-2</StyledText>
          </Flex>
          <Flex flexDirection="column" marginRight={SPACING.spacing4}>
            <StyledText as="h6">left mount</StyledText>
            <StyledText as="p">P300 8-Channel GEN 2</StyledText>
          </Flex>
          <Flex flexDirection="column" marginRight={SPACING.spacing4}>
            <StyledText as="h6">right mount</StyledText>
            <StyledText as="p">P300 8-Channel GEN 2</StyledText>
          </Flex>
          <Flex flexDirection="column" marginRight={SPACING.spacing4}>
            <StyledText as="h6">modules</StyledText>
            <Flex>
              <Icon
                name="ot-heater-shaker"
                height="1rem"
                marginRight={SPACING.spacing3}
              />
              <Icon
                name="ot-heater-shaker"
                height="1rem"
                marginRight={SPACING.spacing3}
              />
              <Icon
                name="ot-heater-shaker"
                height="1rem"
                marginRight={SPACING.spacing3}
              />
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
        Last updated DD MM YYYY
      </StyledText>
    </Flex>
  )
}
