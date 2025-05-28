import { MemoryRouter } from 'react-router-dom'

import {
  ALIGN_START,
  DIRECTION_ROW,
  Flex,
  SPACING,
} from '@opentrons/components'

import { NavTab } from './'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

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
      <NavTab to="/privacy" tabName="Privacy" />
      <NavTab to="/advanced" tabName="Advanced" />
      <NavTab to="/feature-flags" tabName="Feature flags" />
    </MemoryRouter>
  </Flex>
)

export const AppSettings = Template.bind({})
