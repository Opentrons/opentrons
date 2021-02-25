// @flow
import * as React from 'react'
import { mountWithProviders } from '@opentrons/components/__utils__'

import { i18n } from '../../../i18n'
import { ListItem, Tooltip } from '@opentrons/components'
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

    render = () => {
      return mountWithProviders(<ProtocolModuleList />, { i18n })
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

    mockModules.forEach((m, index) => {
      const listItem = titledList.find(ListItem).at(index)
      const allText = listItem.text()
      const toolTip = listItem.find('UsbPortInfo').find(Tooltip)

      expect(listItem.prop('iconName')).toBe('check-circle')
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

    mockModules.forEach((m, index) => {
      const listItem = titledList.find(ListItem).at(index)
      const allText = listItem.text()
      const toolTip = listItem.find('UsbPortInfo').find(Tooltip)

      expect(allText).toContain(`Magnetic Module GEN${index === 0 ? 1 : 2}`)

      if (m.slot === mockMagneticModule1.slot) {
        expect(listItem.prop('iconName')).toBe('checkbox-blank-circle-outline')
        expect(allText).not.toContain('N/A')
        expect(toolTip.exists()).toBe(false)
      } else {
        expect(listItem.prop('iconName')).toBe('check-circle')
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

    mockModules.forEach((m, index) => {
      const listItem = titledList.find(ListItem).at(index)
      const allText = listItem.text()
      const toolTip = listItem.find('UsbPortInfo').find(Tooltip)

      expect(allText).toContain(`Magnetic Module GEN${index === 0 ? 1 : 2}`)
      expect(listItem.prop('iconName')).toBe('checkbox-blank-circle-outline')
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
