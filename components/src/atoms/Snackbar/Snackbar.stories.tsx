import * as React from 'react'

import { Snackbar as SnackbarComponent } from '.'
import { customViewports } from '../../../../.storybook/preview'
import { Flex, STYLE_PROPS } from '../../primitives'
import {
  ALIGN_CENTER,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_CENTER,
} from '../../styles'
import { SPACING, VIEWPORT } from '../../ui-style-constants'
import { PrimaryButton } from '../buttons'
import { StyledText } from '../StyledText'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof SnackbarComponent> = {
  title: 'Helix/Atoms/Snackbar',
  component: SnackbarComponent,
  viewport: {
    options: [VIEWPORT.touchScreenViewport, customViewports],
  },
  argTypes: {
    // Disable all StyleProps
    ...Object.fromEntries(
      [...STYLE_PROPS, 'as', 'ref', 'theme', 'forwardedAs'].map(prop => [
        prop,
        { table: { disable: true } },
      ])
    ),
    message: {
      control: 'text',
    },
    duration: {
      control: 'number',
    },
  },
}

// Define the render function as a React Functional Component
const SnackbarRenderComponent: React.FC<
  React.ComponentProps<typeof SnackbarComponent>
> = args => {
  const [isShowSnackbar, setIsShowSnackbar] = React.useState<boolean>(false)

  const handleClick = (): void => {
    setIsShowSnackbar(true)
  }

  return (
    <>
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingY={SPACING.spacing16}
        gap={SPACING.spacing8}
      >
        <PrimaryButton onClick={handleClick}>Click me</PrimaryButton>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            oddStyle="level4HeaderRegular"
          >
            When clicking the button, the Snackbar shows up in the bottom.
          </StyledText>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            oddStyle="level4HeaderRegular"
          >
            By default the Snackbar will disappear after 4 seconds.
          </StyledText>
        </Flex>
      </Flex>
      {isShowSnackbar && (
        <Flex
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          width="100%"
          position="absolute"
          bottom={SPACING.spacing40}
          zIndex={1000}
        >
          <SnackbarComponent
            {...args}
            onClose={() => {
              setIsShowSnackbar(false)
            }}
          />
        </Flex>
      )}
    </>
  )
}

const SnackbarTemplate: Story = {
  render: args => <SnackbarRenderComponent {...args} />,
}

export default meta
type Story = StoryObj<typeof SnackbarComponent>

export const Snackbar: Story = {
  ...SnackbarTemplate,
  args: {
    message: 'Short and sweet message',
    duration: 4000,
  },
}
