import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { mountWithProviders } from '@opentrons/components'

import { i18n } from '../../../i18n'
import { Box, Flex, ListItem, Tooltip } from '@opentrons/components'
import { mockMagneticModule } from '../../../redux/modules/__fixtures__'
import * as robotSelectors from '../../../redux/robot/selectors'
import * as moduleSelectors from '../../../redux/modules/selectors'
import { ProtocolModuleList } from '..'
import { ApiSessionModule } from '../../../redux/robot'
import { MatchedModule } from '../../../redux/modules/types'

jest.mock('../../../redux/robot/selectors')
jest.mock('../../../redux/modules/selectors')

const mockGetModules = robotSelectors.getModules as jest.MockedFunction<
  typeof robotSelectors.getModules
>

const mockGetMatchedModules = moduleSelectors.getMatchedModules as jest.MockedFunction<
  typeof moduleSelectors.getMatchedModules
>
const mockGetModulesByModel = robotSelectors.getModulesByModel as jest.MockedFunction<
  typeof robotSelectors.getModulesByModel
>
const mockGetModulesByProtocolLoadOrder = robotSelectors.getModulesByProtocolLoadOrder as jest.MockedFunction<
  typeof robotSelectors.getModulesByProtocolLoadOrder
>

type MockedModuleType = Pick<
  ApiSessionModule,
  'model' | 'slot' | '_id' | 'protocolLoadOrder'
>

const mockMagneticModule1: MockedModuleType = {
  model: 'magneticModuleV1' as ApiSessionModule['model'],
  slot: '1' as ApiSessionModule['slot'],
  _id: 1234,
  protocolLoadOrder: 0,
}

const mockMagneticModule2: MockedModuleType = {
  model: 'magneticModuleV2' as ApiSessionModule['model'],
  slot: '3' as ApiSessionModule['slot'],
  _id: 2345,
  protocolLoadOrder: 1,
}

const mockMagneticModuleV2 = {
  model: 'magneticModuleV2' as ApiSessionModule['model'],
  slot: '1' as ApiSessionModule['slot'],
  _id: 1234,
  protocolLoadOrder: 0,
}

const mockMatchedModule1: MatchedModule = {
  module: {
    ...mockMagneticModule,
    usbPort: { hub: null, port: 1 },
  },
  slot: '1' as ApiSessionModule['slot'],
}

const mockMatchedModule2: MatchedModule = {
  module: {
    ...mockMagneticModule,
    usbPort: { hub: 2, port: 3 },
  },
  slot: '3' as ApiSessionModule['slot'],
}

const mockLegacyMatchedModule: MatchedModule = {
  module: {
    ...mockMagneticModule,
    usbPort: { hub: null, port: null },
  },
  slot: '3' as ApiSessionModule['slot'],
}

const mockModules = [mockMagneticModule1, mockMagneticModule2]
const mockModulesByModel = {
  magneticModuleV1: [mockMagneticModule1],
  magneticModuleV2: [mockMagneticModule2],
} as any

describe('ModuleList', () => {
  let render: (location?: string) => ReturnType<typeof mountWithProviders>

  beforeEach(() => {
    mockGetModules.mockReturnValue(mockModules)
    mockGetModulesByModel.mockReturnValue(mockModulesByModel)
    mockGetModulesByProtocolLoadOrder.mockReturnValue(mockModules)

    render = (location: string = '/') => {
      return mountWithProviders(
        <StaticRouter context={{}} location={location}>
          <ProtocolModuleList />,
        </StaticRouter>,
        { i18n }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders correct module info with all required modules present', () => {
    const matchedMods = [mockMatchedModule1, mockMatchedModule2]
    mockGetMatchedModules.mockReturnValue(matchedMods)

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(true)
    const titledList = wrapper.find('TitledList')
    const headers = titledList.find(Flex).at(0)
    const headerText = headers.text()
    expect(headerText).not.toContain(`USB order (L to R)`)
    const listItem = titledList.find(ListItem)
    const box = listItem.find(Box)
    mockModules.forEach((m, index) => {
      const flexbox = box.find(Flex).at(index === 0 ? 0 : 2)
      const allText = flexbox.text()
      const toolTip = flexbox.find('UsbPortInfo').find(Tooltip)
      expect(allText).toContain(`Magnetic Module GEN${index === 0 ? 1 : 2}`)
      expect(allText).toContain(
        `Port ${
          matchedMods[index].module.usbPort.hub ||
          matchedMods[index].module.usbPort.port
        }`
      )
      expect(toolTip.exists()).toBe(false)
    })
  })

  it('render correct moulde info with one required module missing', () => {
    mockGetMatchedModules.mockReturnValue([mockMatchedModule2])

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(true)
    const titledList = wrapper.find('TitledList')
    const listItem = titledList.find(ListItem)
    const box = listItem.find(Box)
    mockModules.forEach((m, index) => {
      const flexbox = box.find(Flex).at(index === 0 ? 0 : 2)
      const allText = flexbox.text()
      const toolTip = flexbox.find('UsbPortInfo').find(Tooltip)
      expect(allText).toContain(`Magnetic Module GEN${index === 0 ? 1 : 2}`)

      if (m.slot === mockMagneticModule1.slot) {
        expect(allText).not.toContain('N/A')
        expect(toolTip.exists()).toBe(false)
      } else {
        expect(allText).toContain('USB Port 2 Hub Port 3')
        expect(toolTip.exists()).toBe(false)
      }
    })
  })

  it('render correct module info for legacy module without USB info', () => {
    mockGetMatchedModules.mockReturnValue([mockLegacyMatchedModule])

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(true)
    const titledList = wrapper.find('TitledList')
    const listItem = titledList.find(ListItem)
    const box = listItem.find(Box)
    mockModules.forEach((m, index) => {
      const flexbox = box.find(Flex).at(index === 0 ? 0 : 2)
      const allText = flexbox.text()
      const toolTip = flexbox.find('UsbPortInfo').find(Tooltip)
      expect(allText).toContain(`Magnetic Module GEN${index === 0 ? 1 : 2}`)

      if (m.slot === mockMagneticModule1.slot) {
        expect(allText).not.toContain('N/A')
        expect(toolTip.exists()).toBe(false)
      } else {
        expect(allText).toContain('N/A')
        expect(toolTip.prop('children')).toBe(
          'Update robot software to see USB port information'
        )
      }
    })
  })

  it('render correct moulde info with all required modules missing', () => {
    mockGetMatchedModules.mockReturnValue([])

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(true)
    const titledList = wrapper.find('TitledList')
    const listItem = titledList.find(ListItem)
    const box = listItem.find(Box)
    mockModules.forEach((m, index) => {
      const flexbox = box.find(Flex).at(index === 0 ? 0 : 2)
      const allText = flexbox.text()
      const toolTip = flexbox.find('UsbPortInfo').find(Tooltip)
      expect(allText).toContain(`Magnetic Module GEN${index === 0 ? 1 : 2}`)
      expect(allText).not.toContain('N/A')
      expect(toolTip.exists()).toBe(false)
    })
  })

  it('render correct module info when multiple modules of the same type are requested', () => {
    mockGetModules.mockReturnValue([mockMagneticModuleV2, mockMagneticModule2])
    mockGetModulesByProtocolLoadOrder.mockReturnValue([
      mockMagneticModuleV2,
      mockMagneticModule2,
    ])

    const matchedMods = [mockMatchedModule1, mockMatchedModule2]
    mockGetMatchedModules.mockReturnValue(matchedMods)

    mockGetModulesByModel.mockReturnValue({
      magneticModuleV2: [mockMagneticModule1, mockMagneticModuleV2],
    })

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(true)
    const titledList = wrapper.find('TitledList')
    const headers = titledList.find(Flex).at(0)
    const headerText = headers.text()
    expect(headerText).toContain(`USB order (L to R)`)
    const listItem = titledList.find(ListItem)
    const box = listItem.find(Box)
    mockModules.forEach((m, index) => {
      const flexbox = box.find(Flex).at(index === 0 ? 0 : 2)
      const allText = flexbox.text()
      const toolTip = flexbox.find('UsbPortInfo').find(Tooltip)
      expect(allText).toContain(`Magnetic Module GEN2`)
      expect(allText).toContain(
        `Port ${
          matchedMods[index].module.usbPort.hub ||
          matchedMods[index].module.usbPort.port
        }`
      )
      expect(toolTip.exists()).toBe(false)
    })
  })

  it('does not renders if no modules is required', () => {
    mockGetModules.mockReturnValue([])
    mockGetModulesByProtocolLoadOrder.mockReturnValue([])

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(false)
  })
})
