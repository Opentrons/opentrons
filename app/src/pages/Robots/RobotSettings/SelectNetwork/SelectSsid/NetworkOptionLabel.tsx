import * as React from 'react'
import styled from 'styled-components'
import { Icon, FONT_BODY_1_DARK } from '@opentrons/components'
import { SECURITY_NONE } from '../../../../../redux/networking'

import type { StyledComponent } from 'styled-components'
import type { IconName } from '@opentrons/components'
import type { WifiNetwork } from '../../../../../redux/networking/types'

const SIGNAL_LEVEL_LOW: number = 25
const SIGNAL_LEVEL_MED: number = 50
const SIGNAL_LEVEL_HIGH: number = 75

const StyledWrapper: StyledComponent<'div', any> = styled.div`
  ${FONT_BODY_1_DARK}
  width: 100%;
  display: flex;
`

const StyledIcon: StyledComponent<typeof Icon, any> = styled(Icon)`
  flex: none;
  height: 1rem;
  width: 1rem;
  padding-left: 0.125rem;
`

const StyledConnectedIcon: StyledComponent<typeof StyledIcon, any> = styled(
  StyledIcon
)`
  margin-left: -0.5rem;
  padding-left: 0;
`

const StyledName: StyledComponent<
  'span',
  any,
  { padLeft: boolean }
> = styled.span`
  flex-basis: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${({ padLeft }: { padLeft: boolean }) => `
    padding-left: ${padLeft ? '0.75rem' : '0.25rem'};
  `}
`

export interface NetworkOptionLabelProps extends WifiNetwork {
  showConnectedIcon: boolean
}

export const NetworkOptionLabel = (
  props: NetworkOptionLabelProps
): JSX.Element => {
  const { ssid, active, securityType, showConnectedIcon } = props
  const hasConnectedIcon = active && showConnectedIcon
  const hasSecureIcon = securityType !== SECURITY_NONE

  return (
    <StyledWrapper>
      {hasConnectedIcon && <StyledConnectedIcon name="check" />}
      <StyledName padLeft={!active}>{ssid}</StyledName>
      {hasSecureIcon && <StyledIcon name="lock" />}
      {renderSignalIcon(props.signal)}
    </StyledWrapper>
  )
}

export const NetworkActionLabel = ({
  label,
}: {
  label: string
}): JSX.Element => <StyledName padLeft={true}>{label}</StyledName>

const renderSignalIcon = (signal: number): JSX.Element => {
  let iconName: IconName

  if (signal <= SIGNAL_LEVEL_LOW) {
    iconName = 'ot-wifi-0'
  } else if (signal <= SIGNAL_LEVEL_MED) {
    iconName = 'ot-wifi-1'
  } else if (signal <= SIGNAL_LEVEL_HIGH) {
    iconName = 'ot-wifi-2'
  } else {
    iconName = 'ot-wifi-3'
  }

  return <StyledIcon name={iconName} />
}
