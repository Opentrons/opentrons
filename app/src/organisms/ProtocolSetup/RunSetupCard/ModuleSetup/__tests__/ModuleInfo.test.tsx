import React from 'react'
import '@testing-library/jest-dom'
import { ModuleModel, ModuleRealType } from '@opentrons/shared-data'
import { ModuleInfo } from '../ModuleInfo'
import { when } from 'jest-when'

jest.mock('../ModuleInfo')

const componentPropsMatcher = (matcher: unknown) =>
  // @ts-expect-error(sa, 2021-08-03): when.allArgs not part of type definition yet for jest-when
  when.allArgs((args, equals) => equals(args[0], matcher))

const mockModuleInfo = ModuleInfo as jest.MockedFunction<typeof ModuleInfo>
const MOCK_IS_ATTACHED = false || true
const MOCK_TC_COORDS = [20, 30, 0]

const STUBBED_ORIENTATION_VALUE = 'left'
const mockTCModule = {
  labwareOffset: { x: 3, y: 3, z: 3 },
  moduleId: 'TCModuleId',
  model: 'thermocyclerModuleV1' as ModuleModel,
  type: 'thermocyclerModuleType' as ModuleRealType,
}

describe('ModuleInfo', () => {
  let props: React.ComponentProps<typeof ModuleInfo>
  beforeEach(() => {
    props = {
      x: 3,
      y: 3,
      orientation: 'left',
      moduleModel: mockTCModule.model,
      usbPort: '',
      hubPort: '',
      isAttached: MOCK_IS_ATTACHED,
    }
  })

  it('should render no modules connected', () => {
    const usbPort = null
    const hubPort = null
    const isAttached = false
    props = {
      ...props,
      usbPort,
      hubPort,
      isAttached,
    }

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          orientation: STUBBED_ORIENTATION_VALUE,
          moduleModel: mockTCModule.model,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          isAttached: true,
          usbPort: null,
          hubPort: null,
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    props = {
      ...props,
      usbPort,
      hubPort,
      isAttached,
    }
  })

  it('should render modules connected on a robot server 4.3 or higher', () => {
    const usbPort = '1'
    const hubPort = '1'
    const isAttached = true
    props = {
      ...props,
      usbPort,
      hubPort,
      isAttached,
    }

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          orientation: STUBBED_ORIENTATION_VALUE,
          moduleModel: mockTCModule.model,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          isAttached: true,
          usbPort: '1',
          hubPort: '1',
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    props = {
      ...props,
      usbPort,
      hubPort,
      isAttached,
    }
  })
  it('should render modules connected on a robot server lower than 4.3', () => {
    const usbPort = null
    const hubPort = null
    const isAttached = true
    props = {
      ...props,
      usbPort,
      hubPort,
      isAttached,
    }

    when(mockModuleInfo)
      .calledWith(
        componentPropsMatcher({
          orientation: STUBBED_ORIENTATION_VALUE,
          moduleModel: mockTCModule.model,
          x: MOCK_TC_COORDS[0],
          y: MOCK_TC_COORDS[1],
          isAttached: true,
          usbPort: null,
          hubPort: null,
        })
      )
      .mockReturnValue(<div>mock module info {mockTCModule.model} </div>)

    props = {
      ...props,
      usbPort,
      hubPort,
      isAttached,
    }
  })
})
