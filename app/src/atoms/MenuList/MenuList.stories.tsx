import * as React from 'react'
import { css } from 'styled-components'
import {
  Flex,
  TYPOGRAPHY,
  COLORS,
  TEXT_ALIGN_LEFT,
  SPACING,
} from '@opentrons/components'
import { MenuList } from './index'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Atoms/MenuList',
  component: MenuList,
} as Meta

const Template: Story<React.ComponentProps<typeof MenuList>> = args => (
  <MenuList {...args} />
)

const style = css`
  width: auto;
  text-align: ${TEXT_ALIGN_LEFT};
  font-size: ${TYPOGRAPHY.fontSizeP};
  padding-bottom: ${TYPOGRAPHY.fontSizeH6};
  background-color: transparent;
  color: ${COLORS.darkBlackEnabled};
  padding-left: ${TYPOGRAPHY.fontSizeLabel};
  padding-right: ${TYPOGRAPHY.fontSizeLabel};
  padding-top: ${SPACING.spacing3};

  &:hover {
    background-color: ${COLORS.lightBlue};
  }

  &:disabled,
  &.disabled {
    color: ${COLORS.darkGreyDisabled};
  }
`
const btn = <Flex css={style}>{'Example menu btn'}</Flex>

export const Primary = Template.bind({})
Primary.args = {
  buttons: [btn, btn],
}
