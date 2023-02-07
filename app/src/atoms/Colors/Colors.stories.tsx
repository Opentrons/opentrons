import * as React from 'react'
import {
  Flex,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  SPACING,
  ALIGN_CENTER,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { Story, Meta } from '@storybook/react'

import { StyledText } from '../text'

export default {
  title: 'App/Atoms/Colors',
} as Meta

interface ColorsStorybookProps {
  name: string
  value: string
}

const Template: Story<ColorsStorybookProps[]> = args => {
  return (
    <Flex flexDirection={DIRECTION_COLUMN} padding={SPACING.spacingXXL}>
      {args.colors.map((color: ColorsStorybookProps) => (
        <Flex
          key={color.name}
          flexDirection={DIRECTION_ROW}
          alignItems={ALIGN_CENTER}
        >
          <Flex
            backgroundColor={color.value}
            padding={SPACING.spacingXXL}
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing4}
            width="25rem"
            height="8rem"
            borderRadius="3px"
          >
            <StyledText
              fontSize="1.5rem"
              lineHeight="1.5rem"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
            >
              {color.name}
            </StyledText>
            <StyledText
              fontSize="1.5rem"
              lineHeight="1.5rem"
              fontWeight={TYPOGRAPHY.fontWeightRegular}
            >
              {color.value}
            </StyledText>
          </Flex>
        </Flex>
      ))}
    </Flex>
  )
}

export const SuccessColors = Template.bind({})
const successColors = [
  {
    name: 'successBackgroundLight',
    value: COLORS.successBackgroundLight,
  },
  {
    name: 'successBackgroundMed',
    value: COLORS.successBackgroundMed,
  },
  {
    name: 'successEnabled',
    value: COLORS.successEnabled,
  },
  {
    name: 'successText',
    value: COLORS.successText,
  },
  {
    name: 'successDisabled',
    value: COLORS.successDisabled,
  },
]
SuccessColors.args = {
  colors: successColors,
}

// export const Holding = Template.bind({})
// Holding.args = {
//   status: 'Holding at target',
//   backgroundColor: COLORS.medBlue,
//   iconColor: COLORS.blueEnabled,
//   pulse: false,
// }

// export const Idle = Template.bind({})
// Idle.args = {
//   status: 'Idle',
//   backgroundColor: COLORS.medGreyEnabled,
//   iconColor: COLORS.darkGreyEnabled,
//   pulse: true,
// }

// export const Error = Template.bind({})
// Error.args = {
//   status: 'Error',
//   backgroundColor: COLORS.warningBackgroundLight,
//   iconColor: COLORS.warningEnabled,
//   pulse: true,
// }
