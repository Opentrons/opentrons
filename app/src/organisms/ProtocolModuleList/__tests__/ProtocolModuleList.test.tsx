import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { mountWithProviders } from '@opentrons/components/__utils__'

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

const mockGetModules = robotSelectors.getModules as jest.MockedFunction<typeof robotSelectors.getModules>

const mockGetMissingModules = moduleSelectors.getMissingModules as jest.MockedFunction<typeof moduleSelectors.getMissingModules>

const mockGetMatchedModules = moduleSelectors.getMatchedModules as jest.MockedFunction<typeof moduleSelectors.getMatchedModules>

type MockedModuleType = Pick<ApiSessionModule, 'model' | 'slot' | '_id'>

const mockMagneticModule1: MockedModuleType = {
  model: 'magneticModuleV1',
  slot: '1',
  _id: 1234,
}

const mockMagneticModule2: MockedModuleType = {
  model: 'magneticModuleV2',
  slot: '3',
  _id: 2345,
}

const mockMatchedModule1: MatchedModule = {
  module: {
    ...mockMagneticModule,
    usbPort: { hub: null, port: 1 },
  },
  slot: '1',
}

const mockMatchedModule2: MatchedModule = {
  module: {
    ...mockMagneticModule,
    usbPort: { hub: 2, port: null },
  },
  slot: '3',
}

const mockLegacyMatchedModule: MatchedModule = {
  module: {
    ...mockMagneticModule,
    usbPort: { hub: null, port: null },
  },
  slot: '3',
}

const mockModules: MockedModuleType[] = [mockMagneticModule1, mockMagneticModule2]

describe('ModuleList', () => {
  let render: (location?: string) => ReturnType<typeof mountWithProviders>

  beforeEach(() => {
    mockGetModules.mockReturnValue(mockModules)

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
    mockGetMissingModules.mockReturnValue([])
    const matchedMods = [mockMatchedModule1, mockMatchedModule2]
    mockGetMatchedModules.mockReturnValue(matchedMods)

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(true)
    const titledList = wrapper.find('TitledList')
    const listItem = titledList.find(ListItem)
    const box = listItem.find(Box)
    mockModules.forEach((m, index) => {
      const flexbox = box.find(Flex).at(index === 0 ? 0 : 4)
      const icon = flexbox.find(`Icon`).at(0)
      const allText = flexbox.text()
      const toolTip = flexbox.find('UsbPortInfo').find(Tooltip)
      expect(icon.prop('name')).toBe('check-circle')
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
    mockGetMissingModules.mockReturnValue([mockMagneticModule1])
    mockGetMatchedModules.mockReturnValue([mockMatchedModule2])

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(true)
    const titledList = wrapper.find('TitledList')
    const listItem = titledList.find(ListItem)
    const box = listItem.find(Box)
    mockModules.forEach((m, index) => {
      const flexbox = box.find(Flex).at(index === 0 ? 0 : 3)
      const icon = flexbox.find(`Icon`).at(0)
      const allText = flexbox.text()
      const toolTip = flexbox.find('UsbPortInfo').find(Tooltip)
      expect(allText).toContain(`Magnetic Module GEN${index === 0 ? 1 : 2}`)

      if (m.slot === mockMagneticModule1.slot) {
        expect(icon.prop('name')).toBe('checkbox-blank-circle-outline')
        expect(allText).not.toContain('N/A')
        expect(toolTip.exists()).toBe(false)
      } else {
        expect(icon.prop('name')).toBe('check-circle')
        expect(allText).toContain('Port 2 via Hub')
        expect(toolTip.exists()).toBe(false)
      }
    })
  })

  it('render correct module info for legacy module without USB info', () => {
    mockGetMissingModules.mockReturnValue([mockMagneticModule1])
    mockGetMatchedModules.mockReturnValue([mockLegacyMatchedModule])

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(true)
    const titledList = wrapper.find('TitledList')
    const listItem = titledList.find(ListItem)
    const box = listItem.find(Box)
    mockModules.forEach((m, index) => {
      const flexbox = box.find(Flex).at(index === 0 ? 0 : 3)
      const icon = flexbox.find(`Icon`).at(0)
      const allText = flexbox.text()
      const toolTip = flexbox.find('UsbPortInfo').find(Tooltip)
      expect(allText).toContain(`Magnetic Module GEN${index === 0 ? 1 : 2}`)

      if (m.slot === mockMagneticModule1.slot) {
        expect(icon.prop('name')).toBe('checkbox-blank-circle-outline')
        expect(allText).not.toContain('N/A')
        expect(toolTip.exists()).toBe(false)
      } else {
        expect(icon.prop('name')).toBe('check-circle')
        expect(allText).toContain('N/A')
        expect(toolTip.prop('children')).toBe(
          'Update robot software to see USB port information'
        )
      }
    })
  })

  it('render correct moulde info with all required modules missing', () => {
    mockGetMissingModules.mockReturnValue([
      mockMagneticModule1,
      mockMagneticModule2,
    ])
    mockGetMatchedModules.mockReturnValue([])

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(true)
    const titledList = wrapper.find('TitledList')
    const listItem = titledList.find(ListItem)
    const box = listItem.find(Box)
    mockModules.forEach((m, index) => {
      const flexbox = box.find(Flex).at(index === 0 ? 0 : 3)
      const icon = flexbox.find(`Icon`).at(0)
      const allText = flexbox.text()
      const toolTip = flexbox.find('UsbPortInfo').find(Tooltip)
      expect(allText).toContain(`Magnetic Module GEN${index === 0 ? 1 : 2}`)
      expect(icon.prop('name')).toBe('checkbox-blank-circle-outline')
      expect(allText).not.toContain('N/A')
      expect(toolTip.exists()).toBe(false)
    })
  })

  it('does not renders if no modules is required', () => {
    mockGetModules.mockReturnValue([])

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(false)
  })
})
