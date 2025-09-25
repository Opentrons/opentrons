import { screen } from '@testing-library/react'
import { beforeEach, describe, it, vi } from 'vitest'

import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'
import {
  TEMPERATURE_APPROACHING_TARGET,
  TimelineFrame,
} from '@opentrons/step-generation'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { getEnableConcurrentModuleActions } from '/protocol-designer/feature-flags/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import {
  getTemperatureLabwareOptions,
  getTemperatureModuleIds,
} from '/protocol-designer/ui/modules/selectors'

import { TemperatureTools } from '../TemperatureTools'

import type { ComponentProps } from 'react'
import type * as FeatureFlagSelectors from '/protocol-designer/feature-flags/selectors'
import type * as LabwareLocationsSelectors from '/protocol-designer/top-selectors/labware-locations'
import type * as ModulesSelectors from '/protocol-designer/ui/modules/selectors'

vi.mock('/protocol-designer/feature-flags/selectors', async importOriginal => {
  const original = await importOriginal<typeof FeatureFlagSelectors>()
  return {
    ...original,
    getEnableConcurrentModuleActions: vi.fn(),
  }
})
vi.mock(
  '/protocol-designer/top-selectors/labware-locations',
  async importOriginal => {
    const original = await importOriginal<typeof LabwareLocationsSelectors>()
    return {
      ...original,
      getRobotStateAtActiveItem: vi.fn(),
    }
  }
)
vi.mock('/protocol-designer/ui/modules/selectors', async importOriginal => {
  const actualFields = await importOriginal<typeof ModulesSelectors>()
  return {
    ...actualFields,
    getTemperatureLabwareOptions: vi.fn(),
    getTemperatureModuleIds: vi.fn(),
  }
})
const render = (props: ComponentProps<typeof TemperatureTools>) => {
  return renderWithProviders(<TemperatureTools {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('TemperatureTools', () => {
  let props: ComponentProps<typeof TemperatureTools>

  beforeEach(() => {
    props = {
      formData: {
        id: 'formId',
        stepType: 'temperature',
        moduleId: 'mockId',
        setTemperature: true,
      } as any,
      focusHandlers: {
        blur: vi.fn(),
        focus: vi.fn(),
        dirtyFields: [],
        focusedField: null,
      },
      toolboxStep: 1,
      propsForFields: {
        moduleId: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'setTemperature',
          updateValue: vi.fn(),
          value: 'mockId',
        },
        setTemperature: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'setTemperature',
          updateValue: vi.fn(),
          value: true,
        },
        targetTemperature: {
          onFieldFocus: vi.fn(),
          onFieldBlur: vi.fn(),
          errorToShow: null,
          disabled: false,
          name: 'targetTemperature',
          updateValue: vi.fn(),
          value: null,
        },
      },
      showFormErrors: false,
      tab: 'aspirate',
      setTab: vi.fn(),
    }

    vi.mocked(getTemperatureModuleIds).mockReturnValue(['mockId'])
    vi.mocked(getTemperatureLabwareOptions).mockReturnValue([
      {
        name: 'mock module',
        value: 'mockId',
      },
    ])
    vi.mocked(getEnableConcurrentModuleActions).mockReturnValue(true)
    const mockRobotState: Partial<TimelineFrame> = {
      modules: {
        mockId: {
          slot: 'mockModuleSlot',
          moduleState: {
            type: TEMPERATURE_MODULE_TYPE,
            status: TEMPERATURE_APPROACHING_TARGET,
            targetTemperature: 123,
          },
        },
      },
    }
    vi.mocked(getRobotStateAtActiveItem).mockReturnValue(mockRobotState as any)
  })

  it('renders a temperature module form with 1 module', () => {
    render(props)
    screen.getByText('Heat or cool')
    screen.getByText('mock module')
    screen.getByText('123 °C')
  })
})
