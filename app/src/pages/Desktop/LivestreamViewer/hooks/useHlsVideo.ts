import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

import { useHost } from '@opentrons/react-api-client'

import type { RefObject } from 'react'

// TODO(jh, 09-05-25): /GET this from the /stream endpoint eventually.
const STREAM_URL = (robotIp: string): string =>
  `http://${robotIp}:31950/hls/stream.m3u8`

export interface UseHlsVideoResult {
  videoRef: RefObject<HTMLVideoElement>
  videoError: string | null
}

// Sets up and manages an HLS video stream player that receives
// camera stream URLs from the main Electron process and displays them.
export function useHlsVideo(): UseHlsVideoResult {
  const host = useHost()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (videoRef.current == null || host == null) {
      return
    }

    const video = videoRef.current

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy()
      }

      const hls = new Hls({
        // Disable DVR/back buffer.
        // Although the scrubber on stream controls will appear to increase
        // linearly with time (when enabled), past segments are not kept in memory.
        backBufferLength: 0,
        // The number of seconds behind the live edge to target playback.
        // Higher values can cause constant buffering due to unready segments.
        liveSyncDuration: 2,
        // If the stream falls more than X seconds behind the live edge,
        // "catch up" to a segment within X seconds behind the live edge
        // by skipping segments
        liveMaxLatencyDuration: 5,
      })

      hlsRef.current = hls

      hls.loadSource(STREAM_URL(host.hostname))
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(e => {
          console.error('Auto-play failed:', e)
          setError('Auto-play failed. Please close and reopen the stream.')
        })
      })

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS error:', event, data)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError(
                `Network error: Cannot connect to ${STREAM_URL(host.hostname)}`
              )
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('Media error in stream')
              break
            default:
              setError('Fatal error loading stream')
              break
          }
        }
      })

      const handleVideoError = (e: ErrorEvent): void => {
        setError(`Video playback error: ${e.message}`)
      }

      video.addEventListener('error', handleVideoError)

      return () => {
        video.removeEventListener('error', handleVideoError)
        if (hlsRef.current) {
          hlsRef.current.destroy()
          hlsRef.current = null
        }
      }
    } else {
      setError('HLS streaming not supported in this browser.')
    }
  }, [host])

  return { videoRef, videoError: error }
}
