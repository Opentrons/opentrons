import * as React from 'react'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  Btn,
  Icon,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
  ALIGN_CENTER,
  POSITION_RELATIVE,
  POSITION_ABSOLUTE,
  TYPOGRAPHY,
  SPACING,
} from '@opentrons/components'

import { StyledText } from '../../../atoms/text'

interface TitleHeaderProps {
  title: string
}

// Note (kj:05/12/2023) This might be a component later
export function TitleHeader({ title }: TitleHeaderProps): JSX.Element {
  const history = useHistory()
  return (
    <Flex
      flexDirection={DIRECTION_ROW}
      justifyContent={JUSTIFY_CENTER}
      alignItems={ALIGN_CENTER}
      marginBottom={SPACING.spacing40}
      position={POSITION_RELATIVE}
    >
      <Btn
        onClick={() => history.push('/network-setup')}
        data-testid={`${title}_header_back_button`}
      >
        <Flex
          alignItems={ALIGN_CENTER}
          flexDirection={DIRECTION_ROW}
          position={POSITION_ABSOLUTE}
          top="10%"
          left="0%"
        >
          <Icon name="back" size="3rem" />
        </Flex>
      </Btn>
      <StyledText as="h2" fontWeight={TYPOGRAPHY.fontWeightBold}>
        {title}
      </StyledText>
    </Flex>
  )
}
