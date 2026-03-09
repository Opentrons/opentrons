import { screen } from '@testing-library/react'
import { beforeEach, describe, it } from 'vitest'

import { FLEX_ROBOT_TYPE, OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { InputDeviceInfo } from '..'
import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../assets/localization'

import type { InputDeviceInfoProps } from '..'

const render = (props: InputDeviceInfoProps) => {
  return renderWithProviders(<InputDeviceInfo {...props} />, {
    i18nInstance: i18n,
  })
}

describe('InputDeviceInfo', () => {
  let mockProps: InputDeviceInfoProps

  beforeEach(() => {
    mockProps = {
      robotType: FLEX_ROBOT_TYPE,
    }
  })

  it('renders input devices header', () => {
    render(mockProps)

    screen.getByText('Input Devices')
  })

  it('renders on deck description text', () => {
    render(mockProps)

    screen.getByText('On Deck')
  })

  it('renders Flex Camera for Flex robot type', () => {
    render(mockProps)

    screen.getByText('Flex Camera')
  })

  it('renders OT-2 Camera for OT-2 robot type', () => {
    const ot2Props = {
      ...mockProps,
      robotType: OT2_ROBOT_TYPE,
    }
    render(ot2Props)

    screen.getByText('OT-2 Camera')
  })
})
