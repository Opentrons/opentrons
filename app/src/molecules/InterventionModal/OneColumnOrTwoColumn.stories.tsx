import { css } from 'styled-components'

import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_SPACE_AROUND,
  RESPONSIVENESS,
} from '@opentrons/components'

import { OneColumnOrTwoColumn } from './'
import { StandInContent } from './story-utils/StandIn'
import { VisibleContainer } from './story-utils/VisibleContainer'

import type { Meta, StoryObj } from '@storybook/react'
import type * as React from 'react'

function Wrapper(props: {}): React.ReactNode {
  return (
    <OneColumnOrTwoColumn>
      <StandInContent>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_AROUND}
          height="100%"
        >
          This component is the only one shown on the ODD.
        </Flex>
      </StandInContent>
      <StandInContent>
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_SPACE_AROUND}
          height="100%"
        >
          This component is shown in the right column on desktop.
        </Flex>
      </StandInContent>
    </OneColumnOrTwoColumn>
  )
}

const meta: Meta<React.ComponentProps<typeof Wrapper>> = {
  title: 'App/Molecules/InterventionModal/OneColumnOrTwoColumn',
  component: Wrapper,
  decorators: [
    Story => (
      <VisibleContainer
        css={css`
          min-width: min(max-content, 100vw);
          @media ${RESPONSIVENESS.touchscreenMediaQuerySpecs} {
            width: 500px;
          }
        `}
      >
        <Story />
      </VisibleContainer>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Wrapper>

export const OneOrTwoColumn: Story = {}
