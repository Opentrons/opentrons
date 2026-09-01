import { useState } from 'react'

import { StyledText } from '../../atoms/StyledText'
import { BORDERS, COLORS } from '../../helix-design-system'
import { RobotInfoLabel } from '../../molecules/RobotInfoLabel'
import { SPACING } from '../../ui-style-constants'
import { ModelessModal } from './'
import styles from './modelessmodal.stories.module.css'

import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps, ReactNode } from 'react'

const meta: Meta<typeof ModelessModal> = {
  title: 'Helix/Molecules/ModelessModal',
  component: ModelessModal,
  tags: ['autodocs'],
  argTypes: {
    onClose: { action: 'closed' },
    defaultWidth: { control: 'number' },
    defaultHeight: { control: 'number' },
  },
}

export default meta
type Story = StoryObj<typeof ModelessModal>

const SampleSpotlightContent = (): ReactNode => (
  <div className={styles.content_container}>
    <div>
      <StyledText desktopStyle="bodyLargeSemiBold">Nickname</StyledText>
      <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.grey60}>
        Opentrons Tough 96 Well Plate 200 µL PCR Full Skirt
      </StyledText>
    </div>

    <div
      style={{
        flex: 1,
        backgroundColor: COLORS.grey10,
        display: 'flex',
        borderRadius: BORDERS.borderRadius4,
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px dashed ${COLORS.bakck90}`,
        minHeight: '200px',
      }}
    >
      <StyledText desktopStyle="bodyDefaultRegular">
        [ 96 Well Plate Image Area ]
      </StyledText>
    </div>
  </div>
)

const InteractiveTemplate = (
  args: ComponentProps<typeof ModelessModal> & { onClose: () => void }
): ReactNode => {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        padding: SPACING.spacing24,
        backgroundColor: COLORS.white,
      }}
    >
      <StyledText desktopStyle="bodyDefaultRegular">
        This modal is draggable and resizable
      </StyledText>

      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true)
          }}
        >
          Open modal
        </button>
      )}

      {isOpen && (
        <ModelessModal
          {...args}
          onClose={() => {
            args.onClose()
            setIsOpen(false)
          }}
        />
      )}
    </div>
  )
}

export const Interactive: Story = {
  render: args => <InteractiveTemplate {...args} />,
  args: {
    header: (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: SPACING.spacing8,
        }}
      >
        <RobotInfoLabel deckLabel="A1" />
        <StyledText desktopStyle="bodyLargeSemiBold">Slot Spotlight</StyledText>
      </div>
    ),
    defaultWidth: 450,
    defaultHeight: 500,
    ariaLabelledby: 'Modeless Modal test',
    'aria-label': 'Close Modal',
    children: <SampleSpotlightContent />,
  },
}

const SimpleVersionTemplate = (
  args: ComponentProps<typeof ModelessModal>
): ReactNode => {
  const [isOpen, setIsOpen] = useState(true)

  return isOpen ? (
    <ModelessModal
      {...args}
      onClose={() => {
        setIsOpen(false)
      }}
    />
  ) : (
    <button
      onClick={() => {
        setIsOpen(true)
      }}
      style={{ padding: SPACING.spacing16 }}
    >
      Open modal
    </button>
  )
}

// no content and string title
export const SimpleVersion: Story = {
  render: args => <SimpleVersionTemplate {...args} />,
  args: {
    header: 'Header',
    defaultWidth: 350,
    defaultHeight: 350,
    ariaLabelledby: 'Simple Modeless Modal test',
    'aria-label': 'Close Modal',
    children: (
      <div className={styles.simple_content_container}>
        <StyledText desktopStyle="bodyDefaultRegular">empty</StyledText>
      </div>
    ),
  },
}
