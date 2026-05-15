import { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

import { useHost } from '@opentrons/react-api-client'

import { isTerminalRunStatus } from '/app/local-resources/runs/utils'

import type { RefObject } from 'react'
import type { CameraData, RunStatus } from '@opentrons/api-client'

// TODO(jh, 09-05-25): /GET this from the /stream endpoint eventually.
const STREAM_URL = (robotIp: string): string =>
  `http://${robotIp}:31950/hls/stream.m3u8`

const RETRY_DELAY_MS = 3000

export interface UseHlsVideoResult {
  videoRef: RefObject<HTMLVideoElement>
  videoError: string | null
}

export function useHlsVideo(
  runStatus: RunStatus | null,
  cameraData: CameraData | null
): UseHlsVideoResult {
  const host = useHost()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)
  const [error, setError] = useState<string | null>(null)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const setupHls = useRef<() => void>()

  const setLivestreamError = (msg: string): void => {
    if (cameraData?.liveStreamEnabled) {
      setError(msg)
    }
  }

  useEffect(() => {
    if (error) {
      console.warn(error)
    }
  }, [error])

  useEffect(
    () => {
      if (videoRef.current == null || host == null) {
        return
      }

      const video = videoRef.current

      setupHls.current = () => {
        if (!Hls.isSupported()) {
          setLivestreamError('HLS streaming not supported in this browser.')
          return
        }

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
          retryCountRef.current = 0
          setError(null)
          video.play().catch(e => {
            console.error('Auto-play failed:', e)
            setLivestreamError(
              'Auto-play failed. Please close and reopen the stream.'
            )
          })
        })

        hls.on(Hls.Events.ERROR, (_, data) => {
          // `fatal` prevents refetching over-aggressively, ex, when the buffer is temporarily depleted.
          if (data.fatal && !isTerminalRunStatus(runStatus)) {
            retryCountRef.current++

            setLivestreamError(
              `Service unavailable. Retrying (${retryCountRef.current})...`
            )

            retryTimeoutRef.current = setTimeout(() => {
              setupHls.current?.()
            }, RETRY_DELAY_MS)
          }
        })

        const handleVideoError = (e: ErrorEvent): void => {
          setLivestreamError(`Video playback error: ${e.message}`)
        }

        video.addEventListener('error', handleVideoError)
      }

      setupHls.current()

      return () => {
        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current)
        }

        if (hlsRef.current) {
          hlsRef.current.destroy()
          hlsRef.current = null
        }

        retryCountRef.current = 0
      }
    },
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [host, runStatus]
  )

  return { videoRef, videoError: error }
}
