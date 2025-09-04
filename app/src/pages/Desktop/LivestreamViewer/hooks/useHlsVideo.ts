import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

import { remote } from '/app/redux/shell/remote'

import type { IpcMainEvent } from 'electron'
import type { RefObject } from 'react'

export interface UseHlsVideoResult {
  videoRef: RefObject<HTMLVideoElement>
  videoError: string | null
}

// Sets up and manages an HLS video stream player that receives
// camera stream URLs from the main Electron process and displays them.
export function useHlsVideo(): UseHlsVideoResult {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Listen for the first camera stream url.
  useEffect(() => {
    const handleConfig = (_: IpcMainEvent, ipcStreamUrl: string): void => {
      if (streamUrl == null) {
        setStreamUrl(ipcStreamUrl)
        setError(null)
      }
    }

    remote.ipcRenderer.on('camera-stream-config', handleConfig)

    return () => {
      remote.ipcRenderer.off('camera-stream-config', handleConfig)
    }
  }, [])

  useEffect(() => {
    if (streamUrl == null || videoRef.current == null) {
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

      hls.loadSource(streamUrl)
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
              setError(`Network error: Cannot connect to ${streamUrl}`)
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
  }, [streamUrl])

  return { videoRef, videoError: error }
}
