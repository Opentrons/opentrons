import React from 'react'
import { shallow } from 'enzyme'
import { Icon } from '@opentrons/components'
import { TitledStepList } from '../TitledStepList'

describe('TitledStepLest', () => {
  let props: React.ComponentProps<typeof TitledStepList>
  beforeEach(() => {
    props = {
      title: 'transfer',
      iconName: 'ot-transfer',
      collapsed: true,
      selected: false,
      hovered: false,
      isMultiSelectMode: false,
      onCollapseToggle: jest.fn(),
    }
  })

  it('renders step title', () => {
    const wrapper = shallow(<TitledStepList {...props} />)
    const heading = wrapper.find('h3')
    expect(heading).toBeDefined()
    expect(heading.text()).toEqual('transfer')
  })

  it('renders step icon', () => {
    const wrapper = shallow(<TitledStepList {...props} />)
    const icon = wrapper.find(Icon).first()
    expect(icon).toBeDefined()
    expect(icon.prop('name')).toEqual(props.iconName)
  })

  it('renders empty checkbox when in multiSelectMode and step IS NOT selected', () => {
    props.isMultiSelectMode = true
    const wrapper = shallow(<TitledStepList {...props} />)
    const selectIcon = wrapper.find('.icon_multiselect')
    expect(selectIcon).toBeDefined()
    expect(selectIcon.prop('name')).toEqual('checkbox-blank-outline')
  })

  it('renders selected checkbox when in multiSelectMode and step IS selected', () => {
    props.isMultiSelectMode = true
    props.selected = true
    const wrapper = shallow(<TitledStepList {...props} />)
    const selectIcon = wrapper.find('.icon_multiselect')
    expect(selectIcon).toBeDefined()
    expect(selectIcon.prop('name')).toEqual('checkbox-marked')
  })

  it('renders selected chevron when TitledStepList is selected', () => {
    props.selected = true
    props.collapsed = true
    const wrapper = shallow(<TitledStepList {...props} />)

    const chevronIcon = wrapper.find('.title_bar_carat > .title_bar_icon')
    expect(chevronIcon.prop('name')).toEqual('chevron-right')
  })

  it('renders expand chevron when TitledStepList is deselected and collapsed', () => {
    props.selected = false
    props.collapsed = true
    const wrapper = shallow(<TitledStepList {...props} />)

    const chevronIcon = wrapper.find('.title_bar_carat > .title_bar_icon')
    expect(chevronIcon.prop('name')).toEqual('chevron-down')
  })

  it('renders collapse chevron and valid children when TitledStepList is deselected and expanded', () => {
    props.selected = false
    props.collapsed = false
    const wrapper = shallow(
      <TitledStepList {...props}>
        <li>substep 1</li> <li>substep 2</li>
      </TitledStepList>
    )

    const chevronIcon = wrapper.find('.title_bar_carat > .title_bar_icon')
    expect(chevronIcon.prop('name')).toEqual('chevron-up')

    const childWrapper = wrapper.find('ol')
    expect(childWrapper).toBeDefined()
    const children = wrapper.find('li')
    expect(children).toHaveLength(2)
  })
})
