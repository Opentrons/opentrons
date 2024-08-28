import * as React from 'react'
import { css } from 'styled-components'
import { Box, COLORS, POSITION_ABSOLUTE } from '@opentrons/components'
import { FeatureFlagsModal } from './organisms'

interface Location {
  x: number
  y: number
}

export const Bouncing = (): JSX.Element => {
  const [isDragging, setIsDragging] = React.useState<boolean>(false)
  const [position, setPosition] = React.useState<Location>({ x: 100, y: 100 })
  const [velocity, setVelocity] = React.useState<Location>({ x: 2, y: 2 })
  const [isPaused, setIsPaused] = React.useState<boolean>(false)
  const [isStopped, setIsStopped] = React.useState<boolean>(false)
  const [showFeatureFlags, setShowFeatureFlags] = React.useState<boolean>(false)

  const divSize = 50

  React.useEffect(() => {
    if (!isPaused && !isStopped) {
      const moveDiv = (): void => {
        const screenWidth = window.innerWidth
        const screenHeight = window.innerHeight

        setPosition(prevPosition => {
          const newX = prevPosition.x + velocity.x
          const newY = prevPosition.y + velocity.y

          if (newX <= 0 || newX + divSize >= screenWidth) {
            setVelocity(prevVelocity => ({
              ...prevVelocity,
              x: prevVelocity.x * -1,
            }))
          }
          if (newY <= 0 || newY + divSize >= screenHeight) {
            setVelocity(prevVelocity => ({
              ...prevVelocity,
              y: prevVelocity.y * -1,
            }))
          }

          return { x: newX, y: newY }
        })
      }

      const intervalId = setInterval(moveDiv, 10)

      return () => {
        clearInterval(intervalId)
      }
    }
  }, [velocity, isPaused, isStopped])

  const handleMouseEnter = (): void => {
    if (!isStopped) {
      setIsPaused(true)
    }
  }

  const handleMouseLeave = (): void => {
    if (!isStopped) {
      setIsPaused(false)
    }
  }

  const handleMouseDown = (): void => {
    if (isStopped) {
      setIsDragging(true)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (isDragging) {
      const newX = e.clientX - divSize / 2
      const newY = e.clientY - divSize / 2
      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = (): void => {
    if (isDragging) {
      setIsDragging(false)
    }
  }

  return (
    <>
      {showFeatureFlags ? (
        <FeatureFlagsModal
          isStopped={isStopped}
          setIsStopped={setIsStopped}
          setIsPaused={setIsPaused}
          setShowFeatureFlags={setShowFeatureFlags}
        />
      ) : null}

      <Box
        onClick={() => {
          setShowFeatureFlags(true)
        }}
        zIndex={4}
        position={POSITION_ABSOLUTE}
        width="3.125rem"
        height="3.125rem"
        backgroundColor={COLORS.blue50}
        borderRadius="50%"
        left={`${position.x}px`}
        top={`${position.y}px`}
        cursor="pointer"
        css={css`
          &:hover {
            background-color: ${COLORS.blue60};
          }
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </>
  )
}
