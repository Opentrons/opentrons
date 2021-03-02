// @flow
import * as React from 'react'
import { StaticRouter } from 'react-router-dom'
import { mountWithProviders } from '@opentrons/components/__utils__'

import { i18n } from '../../../i18n'
import { Box, Icon, Flex, ListItem, Tooltip } from '@opentrons/components'
import * as robotSelectors from '../../../redux/robot/selectors'
import * as moduleSelectors from '../../../redux/modules/selectors'
import { ProtocolModuleList } from '..'

import type { State } from '../../../redux/types'

jest.mock('../../../redux/robot/selectors')
jest.mock('../../../redux/modules/selectors')

const mockGetModules: JestMockFn<
  [State],
  $Call<typeof robotSelectors.getModules, State>
> = robotSelectors.getModules

const mockGetMissingModules: JestMockFn<
  [State],
  $Call<typeof moduleSelectors.getMissingModules, State>
> = moduleSelectors.getMissingModules

const mockMagneticModule1 = {
  model: 'magneticModuleV1',
  slot: '1',
  _id: 1234,
}

const mockMagneticModule2 = {
  model: 'magneticModuleV2',
  slot: '3',
  _id: 2345,
}

const mockModules = [mockMagneticModule1, mockMagneticModule2]

describe('ModuleList', () => {
  let render

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

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(true)
    const titledList = wrapper.find('TitledList')
    const listItem = titledList.find(ListItem)
    const box = listItem.find(Box)
    mockModules.forEach((m, index) => {
      const flexbox = box.find(Flex).at(index=== 0 ? 0 : 2)
      const icon = flexbox.find(`Icon`).at(0)
      const allText = flexbox.text()
      const toolTip = flexbox.find('UsbPortInfo').find(Tooltip)
      expect(icon.prop('name')).toBe('check-circle')
      expect(allText).toContain(`Magnetic Module GEN${index === 0 ? 1 : 2}`)
      expect(allText).toContain('N/A')
      expect(toolTip.prop('children')).toBe(
        'Update robot software to see USB port information'
      )
    })
  })

  it('render correct moulde info with one required module missing', () => {
    mockGetMissingModules.mockReturnValue([mockMagneticModule1])

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(true)
    const titledList = wrapper.find('TitledList')
    const listItem = titledList.find(ListItem)
    const box = listItem.find(Box)
    mockModules.forEach((m, index) => {
      const flexbox = box.find(Flex).at(index=== 0 ? 0 : 1)
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

    const { wrapper } = render()

    expect(wrapper.find('TitledList[title="modules"]').exists()).toBe(true)
    const titledList = wrapper.find('TitledList')
    const listItem = titledList.find(ListItem)
    const box = listItem.find(Box)
    mockModules.forEach((m, index) => {
      const flexbox = box.find(Flex).at(index=== 0 ? 0 : 1)
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
