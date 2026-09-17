import { useState } from 'react'

import {
  SPACING,
  StyledText,
  TYPOGRAPHY,
  VIEWPORT,
} from '@opentrons/components'

import { MediumButton } from '/app/atoms/buttons'

import { LoggedOutOverlay } from './index'

import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof LoggedOutOverlay> = {
  title: 'ODD/Molecules/LoggedOutOverlay',
  component: LoggedOutOverlay,
  parameters: {
    layout: 'fullscreen',
  },
  ...VIEWPORT.touchScreenViewport,
}

export default meta

type Story = StoryObj<typeof LoggedOutOverlay>

export const Default: Story = {
  render: function DefaultRender() {
    const [showOverlay, setShowOverlay] = useState(false)

    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: SPACING.spacing24,
        }}
      >
        <MediumButton
          buttonText="Show overlay"
          onClick={() => {
            setShowOverlay(true)
          }}
        />
        <StyledText
          oddStyle="level3HeaderBold"
          textAlign={TYPOGRAPHY.textAlignCenter}
        >
          This is some placeholder text.
        </StyledText>
        {showOverlay && (
          <LoggedOutOverlay
            onClick={() => {
              setShowOverlay(false)
            }}
          />
        )}
      </div>
    )
  },
}
