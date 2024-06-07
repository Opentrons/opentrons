import * as React from 'react'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  Link,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { UploadInput as UploadInputComponent } from './index'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof UploadInputComponent> = {
  title: 'App/Molecules/UploadInput',
  component: UploadInputComponent,
  decorators: [
    Story => {
      return (
        <Flex
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          marginY={SPACING.spacing20}
        >
          <Story />
        </Flex>
      )
    },
  ],
}

export default meta

type Story = StoryObj<typeof UploadInputComponent>

const uploadText = (
  <Flex
    flexDirection={DIRECTION_ROW}
    gridGap={SPACING.spacing8}
    alignItems={ALIGN_CENTER}
  >
    <StyledText>{'CSV file'}</StyledText>
    <Icon name="information" size="0.75rem" data-testid="mockIcon" />
  </Flex>
)

const dragAndDropText = (
  <StyledText as="p">
    {'Drag and drop or '}
    <Link color={COLORS.blue55} role="button">
      browse
    </Link>{' '}
    {' your files'}
  </StyledText>
)

export const UploadInput: Story = {
  args: {
    onUpload: () => {},
    uploadText,
    uploadButtonText: 'Choose file',
    dragAndDropText,
  },
}
