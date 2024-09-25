import { ICON_DATA_BY_NAME } from '@opentrons/components'
import { InterventionContent } from '.'
import { TwoColumn } from '../TwoColumn'
import { StandInContent } from '../story-utils/StandIn'
import { VisibleContainer } from '../story-utils/VisibleContainer'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof InterventionContent> = {
  title:
    'App/Molecules/InterventionModal/InterventionContent/InterventionContent',
  component: InterventionContent,
  argTypes: {
    headline: {
      control: {
        type: 'text',
      },
    },
    infoProps: {
      control: {
        type: 'object',
      },
      type: {
        control: {
          type: 'select',
        },
        options: [
          'location',
          'location-arrow-location',
          'location-colon-location',
        ],
      },
      labwareName: {
        control: 'text',
      },
      currentLocationProps: {
        control: {
          type: 'object',
        },
        slotName: {
          control: 'text',
        },
        iconName: {
          control: {
            type: 'select',
          },
          options: Object.keys(ICON_DATA_BY_NAME),
        },
      },
      newLocationProps: {
        control: {
          type: 'object',
        },
        slotName: {
          control: 'text',
        },
        iconName: {
          control: {
            type: 'select',
          },
          options: Object.keys(ICON_DATA_BY_NAME),
        },
      },
      labwareNickname: {
        control: {
          type: 'text',
        },
      },
    },
    notificationProps: {
      control: {
        type: 'object',
      },
      type: {
        control: {
          type: 'select',
        },
        options: ['alert', 'error', 'neutral', 'success'],
      },
      heading: {
        control: {
          type: 'text',
        },
      },
      message: {
        control: {
          type: 'text',
        },
      },
    },
  },
  decorators: [
    Story => (
      <VisibleContainer>
        <TwoColumn>
          <Story />
          <StandInContent />
        </TwoColumn>
      </VisibleContainer>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof InterventionContent>

export const InterventionContentStory: Story = {
  args: {
    headline: 'You have something to do',
    infoProps: {
      type: 'location',
      labwareName: 'Biorad Plate 200ML',
      labwareNickname: 'The biggest plate I have',
      currentLocationProps: {
        slotName: 'C2',
      },
    },
    notificationProps: {
      type: 'alert',
      heading: 'An alert',
      message: 'Oh no',
    },
  },
}
