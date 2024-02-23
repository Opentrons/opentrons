import * as React from 'react'
import { MemoryRouter } from 'react-router'
import {
  Flex,
  ALIGN_START,
  DIRECTION_ROW,
  SPACING,
} from '@opentrons/components'
import { NavTab } from './'

import type { Story, Meta } from '@storybook/react'

export default {
  title: 'App/Molecules/NavTab',
  component: NavTab,
} as Meta

const Template: Story<React.ComponentProps<typeof NavTab>> = args => (
  <Flex
    marginTop={SPACING.spacing16}
    alignItems={ALIGN_START}
    flexDirection={DIRECTION_ROW}
    gridGap={SPACING.spacing20}
  >
    <MemoryRouter initialEntries={['/general']}>
      <NavTab to="/general" tabName="General" />
      <NavTab to="/advanced" tabName="Advanced" />
      <NavTab to="/feature-flags" tabName="Feature flags" />
    </MemoryRouter>
  </Flex>
)

export const AppSettings = Template.bind({})
