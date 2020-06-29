// @flow
import type { IconName, IconProps } from '@opentrons/components'
import { FONT_BODY_1_DARK, Icon } from '@opentrons/components'
import * as React from 'react'
import type { StyledComponent } from 'styled-components'
import styled from 'styled-components'

import { SECURITY_NONE } from '../../../../networking'
import type { WifiNetwork } from '../../../../networking/types'

const SIGNAL_LEVEL_LOW = 25
const SIGNAL_LEVEL_MED = 50
const SIGNAL_LEVEL_HIGH = 75

const StyledWrapper: StyledComponent<{||}, {||}, HTMLDivElement> = styled.div`
  ${FONT_BODY_1_DARK}
  width: 100%;
  display: flex;
`

const StyledIcon: StyledComponent<IconProps, {||}, typeof Icon> = styled(Icon)`
  flex: none;
  height: 1rem;
  width: 1rem;
  padding-left: 0.125rem;
`

const StyledConnectedIcon: StyledComponent<
  IconProps,
  {||},
  typeof StyledIcon
> = styled(StyledIcon)`
  margin-left: -0.5rem;
  padding-left: 0;
`

const StyledName: StyledComponent<
  {| padLeft?: boolean |},
  {||},
  HTMLSpanElement
> = styled.span`
  flex-basis: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${({ padLeft }) => `
    padding-left: ${padLeft ? '0.75rem' : '0.25rem'};
  `}
`

export type NetworkOptionLabelProps = {|
  ...WifiNetwork,
  showConnectedIcon: boolean,
|}

export const NetworkOptionLabel = (
  props: NetworkOptionLabelProps
): React.Node => {
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
}: {|
  label: string,
|}): React.Node => <StyledName padLeft={true}>{label}</StyledName>

const renderSignalIcon = signal => {
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
