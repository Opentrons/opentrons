// @flow
import * as React from 'react'
import styled from 'styled-components'
import { Icon, FONT_BODY_1_DARK } from '@opentrons/components'
import { SECURITY_NONE } from '../../../../networking'

import type { StyledComponent } from 'styled-components'
import type { IconName, IconProps } from '@opentrons/components'
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
`

const StyledName: StyledComponent<
  {| padLeft?: boolean, padRight?: boolean |},
  {||},
  HTMLSpanElement
> = styled.span`
  flex-basis: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  ${({ padLeft, padRight }) => `
    padding-left: ${padLeft ? '1.25rem' : '0.25rem'};
    padding-right: ${padRight ? '1.25rem' : '0.25rem'};
  `}
`

export const NetworkOptionLabel = (props: WifiNetwork) => {
  const { ssid, active, securityType } = props
  const hasSecureIcon = securityType !== SECURITY_NONE

  return (
    <StyledWrapper>
      {active && <StyledIcon name="check" />}
      <StyledName padLeft={!active} padRight={!hasSecureIcon}>
        {ssid}
      </StyledName>
      {hasSecureIcon && <StyledIcon name="lock" />}
      {renderSignalIcon(props.signal)}
    </StyledWrapper>
  )
}

export const NetworkActionLabel = ({ label }: {| label: string |}) => (
  <StyledName padLeft={false} padRight={false}>
    {label}
  </StyledName>
)

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
