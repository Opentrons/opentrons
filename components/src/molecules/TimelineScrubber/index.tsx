import styles from './timelinescrubber.module.css'
import { TrackSlider } from './TrackSlider'

import type { ReactNode } from 'react'
import type { TrackData } from './TrackSlider'

export interface TimelineScrubberProps {
  tracks: TrackData[]
  onTrackChange: (updatedTrack: TrackData) => void
}

export function TimelineScrubber({
  tracks,
  onTrackChange,
}: TimelineScrubberProps): ReactNode {
  const handleValueChange = (id: string, newValue: number): void => {
    const updatedTrack = { id, value: newValue }
    onTrackChange(updatedTrack)
  }

  return (
    <div className={styles.scrubber_container}>
      {tracks.map(track => (
        <TrackSlider
          key={track.id}
          track={track}
          onChange={handleValueChange}
        />
      ))}
    </div>
  )
}
