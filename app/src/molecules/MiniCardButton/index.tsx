import * as React from 'react'
import { useHistory } from 'react-router-dom'

import {
  Btn,
  SPACING,
  COLORS,
  Icon,
  DIRECTION_COLUMN,
  ALIGN_FLEX_START,
} from '@opentrons/components'

import { StyledText } from '../../atoms/text'

import type { IconName } from '@opentrons/components'

// Note: kj width & height default values would be changed in hi-fi
export interface MiniCardButtonProps {
  width?: string
  height?: string
  iconName: IconName
  cardName: string
  destinationPath: string
}

export function MiniCardButton({
  width = '19rem',
  height = '9.375rem',
  iconName,
  cardName,
  destinationPath,
}: MiniCardButtonProps): JSX.Element {
  const history = useHistory()
  return (
    <Btn
      display="flex"
      flexDirection={DIRECTION_COLUMN}
      alignItems={ALIGN_FLEX_START}
      padding={SPACING.spacing5}
      borderRadius="12px"
      onClick={() => history.push(`${destinationPath}`)}
      backgroundColor={COLORS.lightGreyPressed}
      width={width}
      height={height}
    >
      <Icon
        name={iconName}
        size="3rem"
        data-testid={`miniCardButton_${String(iconName)}`}
      />
      <StyledText
        marginTop={SPACING.spacing5}
        fontSize="1.3125rem"
        lineHeight="1.8125rem"
        fontWeight="700"
      >
        {cardName}
      </StyledText>
    </Btn>
  )
}
