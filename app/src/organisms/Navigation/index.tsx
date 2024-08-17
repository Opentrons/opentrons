import * as React from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import styled from 'styled-components'

import {
  Icon,
  Flex,
  Box,
  COLORS,
  SPACING,
  DIRECTION_ROW,
  ALIGN_CENTER,
  JUSTIFY_SPACE_BETWEEN,
  truncateString,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  DISPLAY_FLEX,
  ALIGN_FLEX_START,
  POSITION_STICKY,
  POSITION_ABSOLUTE,
  POSITION_STATIC,
  BORDERS,
  RESPONSIVENESS,
  OVERFLOW_SCROLL,
} from '@opentrons/components'
import { ODD_FOCUS_VISIBLE } from '../../atoms/buttons/constants'

import { useNetworkConnection } from '../../resources/networking/hooks/useNetworkConnection'
import { getLocalRobot } from '../../redux/discovery'
import { NavigationMenu } from './NavigationMenu'
import type { ON_DEVICE_DISPLAY_PATHS } from '../../App/OnDeviceDisplayApp'

const NAV_LINKS: Array<typeof ON_DEVICE_DISPLAY_PATHS[number]> = [
  '/protocols',
  '/quick-transfer',
  '/instruments',
  '/robot-settings',
]

// TODO(sb:7/10/24): update this wrapper to fade on both sides only when not scrolled completely to that side
// This will be accomplished in PLAT-399
const CarouselWrapper = styled.div`
  display: ${DISPLAY_FLEX};
  flex-direction: ${DIRECTION_ROW};
  align-items: ${ALIGN_FLEX_START};
  width: 42.25rem;
  overflow-x: ${OVERFLOW_SCROLL};
  -webkit-mask-image: linear-gradient(90deg, #000 90%, transparent);
  &::-webkit-scrollbar {
    display: none;
  }
`

const CHAR_LIMIT_WITH_ICON = 12
const CHAR_LIMIT_NO_ICON = 15

interface NavigationProps {
  //  optionalProps for setting the zIndex and position between multiple sticky elements
  //  used for ProtocolDashboard
  setNavMenuIsOpened?: React.Dispatch<React.SetStateAction<boolean>>
  longPressModalIsOpened?: boolean
}
export function Navigation(props: NavigationProps): JSX.Element {
  const { setNavMenuIsOpened, longPressModalIsOpened } = props
  const { t } = useTranslation('top_navigation')
  const localRobot = useSelector(getLocalRobot)
  const [showNavMenu, setShowNavMenu] = React.useState<boolean>(false)
  const robotName = localRobot?.name != null ? localRobot.name : 'no name'

  // We need to display an icon for what type of network connection (if any)
  // is active next to the robot's name. The designs call for it to change color
  // from black70 to black100 depending on the which page is being displayed
  // but we are using ReactRouter NavLinks, which doesn't easily support complex
  // children like this. For now the icon will just be black70 regardless.
  //
  // TODO(ew, 05/21/2023): Integrate icon into NavLink so color changes
  const networkConnection = useNetworkConnection(robotName)
  const { icon: iconName } = networkConnection

  const handleMenu = (openMenu: boolean): void => {
    if (setNavMenuIsOpened != null) {
      setNavMenuIsOpened(openMenu)
    }
    setShowNavMenu(openMenu)
  }

  const scrollRef = React.useRef<HTMLDivElement>(null)
  const [isScrolled, setIsScrolled] = React.useState<boolean>(false)

  const observer = new IntersectionObserver(([entry]) => {
    setIsScrolled(!entry.isIntersecting)
  })
  if (scrollRef.current != null) {
    observer.observe(scrollRef.current)
  }
  function getPathDisplayName(path: typeof NAV_LINKS[number]): string {
    switch (path) {
      case '/instruments':
        return t('instruments')
      case '/protocols':
        return t('protocols')
      case '/robot-settings':
        return t('settings')
      case '/quick-transfer':
        return t('quick_transfer')
      default:
        return ''
    }
  }

  return (
    <>
      {/* Empty box to detect scrolling */}
      <Flex ref={scrollRef} />
      <Flex
        flexDirection={DIRECTION_ROW}
        alignItems={ALIGN_CENTER}
        justifyContent={JUSTIFY_SPACE_BETWEEN}
        height="7.75rem"
        zIndex={showNavMenu || Boolean(longPressModalIsOpened) ? 0 : 3}
        position={
          showNavMenu || Boolean(longPressModalIsOpened)
            ? POSITION_STATIC
            : POSITION_STICKY
        }
        paddingX={SPACING.spacing40}
        top="0"
        width="100%"
        backgroundColor={COLORS.white}
        boxShadow={isScrolled ? BORDERS.shadowBig : ''}
        gridGap={SPACING.spacing24}
        aria-label="Navigation_container"
      >
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing32}>
          <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
            <NavigationLink
              to="/dashboard"
              name={truncateString(
                robotName,
                iconName != null ? CHAR_LIMIT_WITH_ICON : CHAR_LIMIT_NO_ICON
              )}
            />
            {iconName != null ? (
              <Icon
                aria-label="network icon"
                name={iconName}
                size="2.5rem"
                color={COLORS.grey60}
              />
            ) : null}
          </Flex>
          <CarouselWrapper>
            <Flex
              flexDirection={DIRECTION_ROW}
              gridGap={SPACING.spacing32}
              marginRight={SPACING.spacing32}
            >
              {NAV_LINKS.map(path => (
                <NavigationLink
                  key={path}
                  to={path}
                  name={getPathDisplayName(path)}
                />
              ))}
            </Flex>
          </CarouselWrapper>
        </Flex>
        <Flex
          marginTop={`-${SPACING.spacing12}`}
          position={POSITION_ABSOLUTE}
          right={SPACING.spacing16}
        >
          <IconButton
            aria-label="overflow menu button"
            onClick={() => {
              handleMenu(true)
            }}
          >
            <Icon
              name="overflow-btn-touchscreen"
              height="3.75rem"
              width="3rem"
              color={COLORS.grey60}
            />
          </IconButton>
        </Flex>
      </Flex>
      {showNavMenu && (
        <NavigationMenu
          onClick={() => {
            handleMenu(false)
          }}
          robotName={robotName}
          setShowNavMenu={setShowNavMenu}
        />
      )}
    </>
  )
}

const NavigationLink = (props: { to: string; name: string }): JSX.Element => (
  <TouchNavLink to={props.to}>
    {props.name}
    <Box width="2.5rem" height="0.3125rem" borderRadius="0.125rem" />
  </TouchNavLink>
)

const TouchNavLink = styled(NavLink)`
  ${TYPOGRAPHY.level3HeaderSemiBold}
  color: ${COLORS.grey50};
  height: 3.5rem;
  display: flex;
  flex-direction: ${DIRECTION_COLUMN};
  align-items: ${ALIGN_CENTER};
  white-space: nowrap;
  &.active {
    color: ${COLORS.black90};
  }
  &.active > div {
    background-color: ${COLORS.purple50};
  }

  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    cursor: default;
  }
`

const IconButton = styled('button')`
  border-radius: ${BORDERS.borderRadius8};
  max-height: 100%;
  background-color: ${COLORS.white};

  &:hover {
    background-color: ${COLORS.grey35};
  }
  &:active {
    background-color: ${COLORS.grey30};
  }
  &:focus-visible {
    box-shadow: ${ODD_FOCUS_VISIBLE};
    background-color: ${COLORS.grey35};
  }
  &:disabled {
    background-color: transparent;
  }
  .${RESPONSIVENESS.TOUCH_ODD_CLASS} {
    cursor: default;
  }
`
