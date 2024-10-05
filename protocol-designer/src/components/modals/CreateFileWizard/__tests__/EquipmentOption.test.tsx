import type * as React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen, cleanup, fireEvent } from '@testing-library/react'
import { BORDERS, COLORS } from '@opentrons/components'
import {
  FLEX_ROBOT_TYPE,
  MAGNETIC_BLOCK_TYPE,
  TEMPERATURE_MODULE_TYPE,
} from '@opentrons/shared-data'
import { i18n } from '../../../../assets/localization'
import { renderWithProviders } from '../../../../__testing-utils__'
import { EquipmentOption } from '../EquipmentOption'

const render = (props: React.ComponentProps<typeof EquipmentOption>) => {
  return renderWithProviders(<EquipmentOption {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('EquipmentOption', () => {
  let props: React.ComponentProps<typeof EquipmentOption>

  beforeEach(() => {
    props = {
      onClick: vi.fn(),
      isSelected: false,
      text: 'mockText',
      robotType: FLEX_ROBOT_TYPE,
      type: 'module',
    }
  })
  afterEach(() => {
    cleanup()
  })
  it('renders the equipment option without checkbox or image', () => {
    render(props)
    screen.getByText('mockText')
  })
  it('renders the equipment option that is disabled', () => {
    props = {
      ...props,
      disabled: true,
    }
    render(props)
    expect(screen.getByLabelText('EquipmentOption_flex_mockText')).toHaveStyle(
      `background-color: ${COLORS.white}`
    )
  })
  it('renders the equipment option without check not selected and image', () => {
    props = {
      ...props,
      showCheckbox: true,
      image: <img src="img" />,
    }
    render(props)
    screen.getByText('mockText')
    screen.getByRole('img')
    expect(
      screen.getByLabelText('EquipmentOption_checkbox-blank-outline')
    ).toHaveStyle(`color: ${COLORS.grey50}`)
    expect(screen.getByLabelText('EquipmentOption_flex_mockText')).toHaveStyle(
      `border: 1px ${BORDERS.styleSolid} ${COLORS.grey30}`
    )
  })
  it('renders the equipment option without check selected', () => {
    props = {
      ...props,
      isSelected: true,
      showCheckbox: true,
    }
    render(props)
    screen.getByText('mockText')
    expect(screen.getByLabelText('EquipmentOption_ot-checkbox')).toHaveStyle(
      `color: ${COLORS.blue50}`
    )
    expect(screen.getByLabelText('EquipmentOption_flex_mockText')).toHaveStyle(
      `border: ${BORDERS.activeLineBorder}`
    )
  })
  it('renders the equipment option with multiples allowed', () => {
    props = {
      ...props,
      multiples: {
        numItems: 1,
        maxItems: 4,
        setValue: vi.fn(),
        isDisabled: false,
        moduleType: TEMPERATURE_MODULE_TYPE,
      },
    }
    render(props)
    screen.getByText('Amount:')
    screen.getByText('1')
    fireEvent.click(screen.getByTestId('EquipmentOption_upArrow'))
    expect(props.multiples?.setValue).toHaveBeenCalled()
    screen.getByTestId('EquipmentOption_downArrow')
  })
  it('renders the equipment option with multiples allowed cta disabled from isDisabled', () => {
    props = {
      ...props,
      multiples: {
        numItems: 1,
        maxItems: 4,
        setValue: vi.fn(),
        isDisabled: true,
        moduleType: TEMPERATURE_MODULE_TYPE,
      },
    }
    render(props)
    fireEvent.click(screen.getByTestId('EquipmentOption_upArrow'))
    expect(props.multiples?.setValue).not.toHaveBeenCalled()
  })
  it('renders the equipment option with multiples allowed cta disabled from hitting max number for temp module', () => {
    props = {
      ...props,
      multiples: {
        numItems: 1,
        maxItems: 7,
        setValue: vi.fn(),
        isDisabled: false,
        moduleType: TEMPERATURE_MODULE_TYPE,
      },
    }
    render(props)
    screen.getByText('1')
    for (let i = 1; i < 7; i++) {
      fireEvent.click(screen.getByTestId('EquipmentOption_upArrow'))
    }
    expect(props.multiples?.setValue).toHaveBeenCalledTimes(6)
  })
  it('renders the equipment option with multiples allowed cta disabled from hitting max number for magnetic block', () => {
    props = {
      ...props,
      multiples: {
        numItems: 1,
        maxItems: 7,
        setValue: vi.fn(),
        isDisabled: false,
        moduleType: MAGNETIC_BLOCK_TYPE,
      },
    }
    render(props)
    screen.getByText('1')
    for (let i = 1; i < 10; i++) {
      fireEvent.click(screen.getByTestId('EquipmentOption_upArrow'))
    }
    expect(props.multiples?.setValue).toHaveBeenCalledTimes(9)
  })
})
