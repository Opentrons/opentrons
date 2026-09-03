import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import clsx from 'clsx'

import { getIsLoggedInToLocalRobot, useLogout } from '/app/redux/robot-auth'

import styles from './dragoverlay.module.css'

const LOG_OUT_THRESHOLD = 0.75
const HOLD_DURATION_MS = 800
const MOVE_THRESHOLD = 10
const HOLD_ZONE = 150
const HANDLE_HEIGHT = 8
const REGRAB_ZONE = HANDLE_HEIGHT + 16
const RESET_TIME_S = 1

export function DragToLogOutOverlay(): JSX.Element | null {
  const isLoggedIn = useSelector(getIsLoggedInToLocalRobot)

  const [isLongPressed, setIsLongPressed] = useState(false)
  const holdTimer = useRef<NodeJS.Timeout | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isAnimatingOverlay, setIsAnimatingOverlay] = useState(false)
  const [y, setY] = useState(0)
  const resetBackupTimer = useRef<NodeJS.Timeout | null>(null)
  const logoutBackupTimer = useRef<NodeJS.Timeout | null>(null)

  const yRef = useRef(0)
  const isLongPressedRef = useRef(false)

  useEffect(() => {
    yRef.current = y
  }, [y])
  useEffect(() => {
    isLongPressedRef.current = isLongPressed
  }, [isLongPressed])

  const startY = useRef(0)
  const startX = useRef(0)
  const activePointerId = useRef<number | null>(null)
  const handleRef = useRef<HTMLDivElement | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const logout = useLogout()

  const logoutPixelThreshold = useMemo(() => {
    return window.innerHeight * LOG_OUT_THRESHOLD
  }, [])

  const clearHoldTimer = useCallback(() => {
    if (holdTimer.current != null) {
      clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }, [])

  const clearResetBackupTimer = useCallback(() => {
    if (resetBackupTimer.current != null) {
      clearTimeout(resetBackupTimer.current)
      resetBackupTimer.current = null
    }
  }, [])

  const clearLogoutBackupTimer = useCallback(() => {
    if (logoutBackupTimer.current != null) {
      clearTimeout(logoutBackupTimer.current)
      logoutBackupTimer.current = null
    }
  }, [])

  // cleanup on unmount
  useEffect(() => clearHoldTimer, [clearHoldTimer])
  useEffect(() => clearResetBackupTimer, [clearResetBackupTimer])

  useEffect(() => {
    const down = (e: PointerEvent): void => {
      if (!e.isPrimary || e.clientY > HOLD_ZONE) {
        return
      }
      const { clientY, clientX, pointerId } = e
      startY.current = clientY
      startX.current = clientX
      activePointerId.current = pointerId
      clearHoldTimer()

      if (isResetting && clientY < REGRAB_ZONE) {
        setIsLongPressed(true)
        setIsResetting(false)
        clearResetBackupTimer()
        handleRef.current?.setPointerCapture(e.pointerId)
        setY(clientY)
      } else {
        holdTimer.current = setTimeout(() => {
          setIsResetting(false)
          clearResetBackupTimer()
          setIsLongPressed(true)
          handleRef.current?.setPointerCapture(e.pointerId)
          setY(clientY)
        }, HOLD_DURATION_MS)
      }
    }

    const move = (e: PointerEvent): void => {
      if (activePointerId.current !== e.pointerId) {
        return
      }
      if (!isLongPressedRef.current) {
        if (Math.abs(e.clientY - startY.current) > MOVE_THRESHOLD) {
          clearHoldTimer()
        }
        return
      }
      setY(e.clientY)
    }

    const end = (): void => {
      clearHoldTimer()
      if (activePointerId.current != null) {
        handleRef.current?.releasePointerCapture(activePointerId.current)
        activePointerId.current = null
      }
      setIsLongPressed(false)
    }

    const reset = (): void => {
      setIsResetting(true)
      if (yRef.current !== 0) {
        setY(0)
        setIsAnimatingOverlay(true)
      }
      clearResetBackupTimer()
      resetBackupTimer.current = setTimeout(
        () => {
          setIsResetting(false)
          setIsAnimatingOverlay(false)
        },
        (RESET_TIME_S + 1) * 1000
      )
    }

    const cancel = (): void => {
      end()
      if (isLongPressedRef.current) {
        reset()
      }
    }

    const up = (event: PointerEvent): void => {
      if (isLongPressedRef.current) {
        const { clientY } = event
        if (clientY > logoutPixelThreshold) {
          setIsLoggingOut(true)
          setY(window.innerHeight - HANDLE_HEIGHT - 16)
          logoutBackupTimer.current = setTimeout(() => {
            logout()
            setIsLoggingOut(false)
          }, 3000)
        } else {
          reset()
        }
      }
      end()
    }

    const touchMove = (e: TouchEvent): void => {
      const { clientX, clientY } = e.touches[0]
      const dx = Math.abs(clientX - startX.current)
      const dy = Math.abs(clientY - startY.current)
      if (dy > dx && isLongPressedRef.current) {
        e.preventDefault() // vertical drag → suppress scroll → no pointercancel
      }
    }
    window.addEventListener('touchmove', touchMove, { passive: false })

    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', cancel)

    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', cancel)
      window.removeEventListener('touchmove', touchMove)
    }
  }, [
    logout,
    logoutPixelThreshold,
    clearHoldTimer,
    clearResetBackupTimer,
    isResetting,
  ])

  const handleOverlayTransitionEnd = (
    e: React.TransitionEvent<HTMLDivElement>
  ): void => {
    if (e.propertyName !== 'transform') return // ignore the background-color transition
    if (isLoggingOut) {
      clearLogoutBackupTimer()
      setIsLoggingOut(false)
      logout()
    }
    if (isResetting) {
      setIsAnimatingOverlay(false)
    }
  }

  const handleHandleTransitionEnd = (
    e: React.TransitionEvent<HTMLDivElement>
  ): void => {
    if (e.propertyName !== 'opacity') return
    setIsResetting(false)
    setIsAnimatingOverlay(false)
    clearResetBackupTimer()
  }

  if (!isLoggedIn) {
    return null
  }

  return (
    <div
      className={clsx(styles.overlay, {
        [styles.animate_transform]: !isLongPressed,
        [styles.overlay_visible]: isLongPressed || isLoggingOut || isResetting,
        [styles.done_animating]: isResetting && !isAnimatingOverlay,
      })}
      style={
        {
          '--drag-overlay-y': `${y}px`,
          '--handle-height': `${HANDLE_HEIGHT}px`,
          '--hold-zone': `${HOLD_ZONE}px`,
          '--reset-time': `${RESET_TIME_S}s`,
        } as any
      }
      ref={overlayRef}
      onTransitionEnd={handleOverlayTransitionEnd}
    >
      <div className={styles.handle_container} ref={handleRef}>
        <div
          className={clsx(styles.handle, {
            [styles.visible]:
              isLongPressed ||
              isLoggingOut ||
              (isResetting && isAnimatingOverlay),
            [styles.handle_fading]: isResetting && !isAnimatingOverlay,
          })}
          onTransitionEnd={handleHandleTransitionEnd}
        ></div>
      </div>
    </div>
  )
}
