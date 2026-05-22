import { useState } from 'react'
import { action } from 'storybook/actions'

import { DIRECTION_COLUMN, SPACING } from '@opentrons/components'

import { TimelineScrubber as TimelineScrubberComponent } from './index'

import type { Meta, StoryObj } from '@storybook/react'
import type { TrackData } from './TrackSlider'

const meta: Meta<typeof TimelineScrubberComponent> = {
  title: 'Helix/Molecules/TimelineScrubber',
  component: TimelineScrubberComponent,
  args: {
    onTrackChange: action('track-changed'),
  },
}

export default meta

type Story = StoryObj<typeof TimelineScrubberComponent>

function TimelineScrubber(args: any): JSX.Element {
  const [tracks, setTracks] = useState<TrackData[]>([
    { id: 'track-1', value: 50 },
  ])

  const handleTrackChange = (updatedTrack: TrackData): void => {
    setTracks(prevTracks =>
      prevTracks.map(track =>
        track.id === updatedTrack.id
          ? { ...track, value: updatedTrack.value }
          : track
      )
    )
    args.onTrackChange?.(updatedTrack)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: DIRECTION_COLUMN,
        gap: SPACING.spacing16,
      }}
    >
      <h3>Timeline Scrubber</h3>
      <p>Drag the sliders to update the values</p>
      <TimelineScrubberComponent
        tracks={tracks}
        onTrackChange={handleTrackChange}
      />
      <div>
        <h4>Current Values:</h4>
        {tracks.map(track => (
          <div key={track.id}>
            {track.id}: {track.value.toFixed(1)}%
          </div>
        ))}
      </div>
    </div>
  )
}

// Interactive story with state management
export const Interactive: Story = {
  render: args => <TimelineScrubber {...args} />,
}
