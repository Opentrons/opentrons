import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_ROW,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  Link,
  SPACING,
  LegacyStyledText,
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
    <LegacyStyledText>{'CSV file'}</LegacyStyledText>
    <Icon name="information" size="0.75rem" />
  </Flex>
)

const dragAndDropText = (
  <LegacyStyledText as="p">
    {'Drag and drop or '}
    <Link color={COLORS.blue55} role="button">
      browse
    </Link>{' '}
    {' your files'}
  </LegacyStyledText>
)

export const CSVFile: Story = {
  args: {
    onUpload: () => {},
    uploadText,
    uploadButtonText: 'Choose file',
    dragAndDropText,
  },
}

export const ProtocolFile: Story = {
  args: {
    onUpload: () => {},
    uploadText:
      'Valid file types: Python files (.py) or Protocol Designer files (.json)',
    dragAndDropText,
  },
}
