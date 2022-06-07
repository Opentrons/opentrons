import * as React from 'react'
import sum from 'lodash/sum'
import {
  Flex,
  SPACING,
  Icon,
  COLORS,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  TYPOGRAPHY,
  JUSTIFY_CENTER,
  SIZE_1,
  BORDERS,
  ALIGN_CENTER,
  SIZE_AUTO,
} from '@opentrons/components'
import { MICRO_LITERS } from '@opentrons/shared-data'
import { StyledText } from '../../../../atoms/text'

import type { Liquid } from './getMockLiquidData'
import { css } from 'styled-components'

interface SetupLiquidsListProps {
  liquids: Liquid[] | null
}

const HIDE_SCROLLBAR = css`
  ::-webkit-scrollbar {
    display: none;
  }
`

export function SetupLiquidsList(props: SetupLiquidsListProps): JSX.Element {
  const { liquids } = props
  return (
    <Flex
      css={HIDE_SCROLLBAR}
      flexDirection={DIRECTION_COLUMN}
      maxHeight={'31.25rem'}
      overflowY={'auto'}
    >
      {liquids?.map(liquid => (
        <LiquidsListItem
          key={liquid.liquidId}
          description={liquid.description}
          displayColor={liquid.displayColor}
          displayName={liquid.displayName}
          volume={sum(Object.values(liquid.volumeByWell))}
        />
      ))}
    </Flex>
  )
}

interface LiquidsListItemProps {
  description: string | null
  displayColor: string
  displayName: string
  volume: number
}

export function LiquidsListItem(props: LiquidsListItemProps): JSX.Element {
  const { description, displayColor, displayName, volume } = props
  return (
    <Flex
      css={BORDERS.cardOutlineBorder}
      flexDirection={DIRECTION_ROW}
      marginBottom={SPACING.spacing3}
      padding={SPACING.spacing4}
    >
      <Flex
        css={BORDERS.cardOutlineBorder}
        padding={'0.75rem'}
        height={'max-content'}
      >
        <Icon name="circle" color={displayColor} size={SIZE_1} />
      </Flex>
      <Flex flexDirection={DIRECTION_COLUMN} justifyContent={JUSTIFY_CENTER}>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginX={SPACING.spacing4}
        >
          {displayName}
        </StyledText>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightRegular}
          color={COLORS.darkGreyEnabled}
          marginX={SPACING.spacing4}
        >
          {description != null ? description : null}
        </StyledText>
      </Flex>
      <Flex
        backgroundColor={COLORS.darkBlackEnabled + '1A'}
        borderRadius={BORDERS.radiusSoftCorners}
        height={'max-content'}
        paddingY={SPACING.spacing2}
        paddingX={SPACING.spacing3}
        alignSelf={ALIGN_CENTER}
        marginLeft={SIZE_AUTO}
      >
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightRegular}>
          {volume} {MICRO_LITERS}
        </StyledText>
      </Flex>
    </Flex>
  )
}
