import * as React from 'react'
import { css } from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Btn,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  Icon,
  JUSTIFY_END,
  JUSTIFY_SPACE_BETWEEN,
  Modal,
  POSITION_ABSOLUTE,
  PrimaryButton,
  SPACING,
  SecondaryButton,
  StyledText,
} from '@opentrons/components'
import { getTopPortalEl } from './components/portals/TopPortal'
import { getFeatureFlagData } from './feature-flags/selectors'
import { userFacingFlags, actions as featureFlagActions } from './feature-flags'
import type { FlagTypes } from './feature-flags'

interface Location {
  x: number
  y: number
}

export const Bouncing = (): JSX.Element => {
  const { t } = useTranslation(['feature_flags', 'shared'])
  const flags = useSelector(getFeatureFlagData)
  const dispatch = useDispatch()
  const [isDragging, setIsDragging] = React.useState<boolean>(false)
  const [position, setPosition] = React.useState<Location>({ x: 100, y: 100 })
  const [velocity, setVelocity] = React.useState<Location>({ x: 2, y: 2 })
  const [isPaused, setIsPaused] = React.useState<boolean>(false)
  const [isStopped, setIsStopped] = React.useState<boolean>(false)
  const [showFeatureFlags, setShowFeatureFlags] = React.useState<boolean>(false)
  const allFlags = Object.keys(flags) as FlagTypes[]

  const prereleaseFlagNames = allFlags.filter(
    flagName => !userFacingFlags.includes(flagName)
  )

  const getDescription = (flag: FlagTypes): string => {
    return t(`feature_flags:${flag}.description`)
  }

  const setFeatureFlags = (
    flags: Partial<Record<FlagTypes, boolean | null | undefined>>
  ): void => {
    dispatch(featureFlagActions.setFeatureFlags(flags))
  }

  const toFlagRow = (flagName: FlagTypes): JSX.Element => {
    const iconName = Boolean(flags[flagName])
      ? 'ot-toggle-input-on'
      : 'ot-toggle-input-off'

    return (
      <Flex key={flagName} justifyContent={JUSTIFY_SPACE_BETWEEN}>
        <Flex flexDirection={DIRECTION_COLUMN}>
          <StyledText desktopStyle="bodyDefaultSemiBold">
            {t(`feature_flags:${flagName}.title`)}
          </StyledText>
          <StyledText desktopStyle="bodyDefaultRegular">
            {getDescription(flagName)}
          </StyledText>
        </Flex>
        <Btn
          role="switch"
          aria-checked={Boolean(flags[flagName])}
          size="2rem"
          css={
            Boolean(flags[flagName])
              ? TOGGLE_ENABLED_STYLES
              : TOGGLE_DISABLED_STYLES
          }
          onClick={() => {
            setFeatureFlags({
              [flagName as string]: !flags[flagName],
            })
          }}
        >
          <Icon name={iconName} height="1rem" />
        </Btn>
      </Flex>
    )
  }

  const prereleaseFlagRows = prereleaseFlagNames.map(toFlagRow)

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
      {showFeatureFlags
        ? createPortal(
            <Modal
              width="40rem"
              type="warning"
              title="Developer Feature Flags"
              onClose={() => {
                setShowFeatureFlags(false)
                setIsPaused(false)
              }}
              footer={
                <Flex
                  padding={SPACING.spacing16}
                  justifyContent={JUSTIFY_END}
                  gridGap={SPACING.spacing8}
                >
                  <SecondaryButton
                    onClick={() => {
                      setIsStopped(prev => !prev)
                      setIsPaused(false)
                    }}
                  >
                    {isStopped ? 'Resume bounce' : 'Stop ball from bouncing'}
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={() => {
                      setShowFeatureFlags(false)
                    }}
                  >
                    {t('shared:close')}
                  </PrimaryButton>
                </Flex>
              }
              closeOnOutsideClick
            >
              <StyledText desktopStyle="bodyDefaultRegular">
                For internal use only.
              </StyledText>
              <Flex
                flexDirection="column"
                marginTop={SPACING.spacing16}
                gridGap={SPACING.spacing16}
              >
                {prereleaseFlagRows}
              </Flex>
            </Modal>,
            getTopPortalEl()
          )
        : null}

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

const TOGGLE_DISABLED_STYLES = css`
  color: ${COLORS.grey50};

  &:hover {
    color: ${COLORS.grey55};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }

  &:disabled {
    color: ${COLORS.grey30};
  }
`

const TOGGLE_ENABLED_STYLES = css`
  color: ${COLORS.blue50};

  &:hover {
    color: ${COLORS.blue55};
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px ${COLORS.yellow50};
  }

  &:disabled {
    color: ${COLORS.grey30};
  }
`
