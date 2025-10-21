import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  FLEX_ROBOT_TYPE,
  OT2_ROBOT_TYPE,
  THERMOCYCLER_MODULE_TYPE,
  THERMOCYCLER_MODULE_V2,
} from '@opentrons/shared-data'

import { renderWithProviders } from '../../../__testing-utils__'
import { i18n } from '../../../assets/localization'
import { HardwareInfo } from '../HardwareInfo'

import type { ComponentProps } from 'react'
import type { NavigateFunction } from 'react-router-dom'
import type { AdditionalEquipmentEntities } from '@opentrons/step-generation'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const render = (props: ComponentProps<typeof HardwareInfo>) => {
  return renderWithProviders(<HardwareInfo {...props} />, {
    i18nInstance: i18n,
  })
}

const mockAdditionalEquipment = {
  trash: {
    name: 'trashBin',
    id: 'trash',
    location: 'cutoutA3',
  },
} as AdditionalEquipmentEntities

describe('HardwareInfo', () => {
  let props: ComponentProps<typeof HardwareInfo>

  beforeEach(() => {
    props = {
      robotType: FLEX_ROBOT_TYPE,
      additionalEquipment: mockAdditionalEquipment,
      modules: [
        {
          type: THERMOCYCLER_MODULE_TYPE,
          slot: 'B1',
          id: 'mockId',
          model: THERMOCYCLER_MODULE_V2,
          pythonName: 'mockPythonName',
          moduleState: {} as any,
        },
      ],
    }
  })

  it('should render trash bin and tc for flex robot and header copy and button', () => {
    render(props)
    screen.getByText('Deck Hardware')
    screen.getByText('A3')
    screen.getAllByText('Trash Bin')
    screen.getByText('A1+B1')
    screen.getAllByText('Thermocycler Module GEN2')
    fireEvent.click(screen.getByText('Edit'))
    expect(mockNavigate).toHaveBeenCalled()
  })
  it('should render tc for ot-2 robot and header copy and button', () => {
    props = {
      ...props,
      robotType: OT2_ROBOT_TYPE,
      modules: [
        {
          type: THERMOCYCLER_MODULE_TYPE,
          slot: '7',
          id: 'mockId',
          model: THERMOCYCLER_MODULE_V2,
          pythonName: 'mockPythonName',
          moduleState: {} as any,
        },
      ],
    }
    render(props)
    screen.getByText('Modules')
    screen.getByText('7,8,10,11')
    screen.getAllByText('Thermocycler Module GEN2')
    fireEvent.click(screen.getByText('Edit'))
    expect(mockNavigate).toHaveBeenCalled()
  })
})
