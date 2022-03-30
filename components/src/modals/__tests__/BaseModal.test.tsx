import * as React from 'react'
import { shallow } from 'enzyme'

import { OVERLAY_BLACK_90, C_WHITE, C_LIGHT_GRAY } from '../../styles'

import { Box, Flex, Text, Btn } from '../../primitives'
import { BaseModal } from '../BaseModal'

describe('BaseModal', () => {
  it('should take up the whole parent', () => {
    const wrapper = shallow(<BaseModal />)
    const box = wrapper.find(Flex).first()

    expect({ ...box.props() }).toMatchObject({
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem',
    })
  })

  it('should have an overlay background that can be overridden', () => {
    const wrapper = shallow(<BaseModal />)
    const box = wrapper.find(Flex).first()

    expect(box.prop('backgroundColor')).toBe('rgba(22, 33, 45, 0.35)')

    wrapper.setProps({ overlayColor: OVERLAY_BLACK_90 })
    expect(wrapper.find(Flex).first().prop('backgroundColor')).toBe(
      OVERLAY_BLACK_90
    )
  })

  it('should have a zIndex that can be overridden', () => {
    const wrapper = shallow(<BaseModal />)
    const box = wrapper.find(Flex).first()

    expect(box.prop('zIndex')).toBe(10)

    wrapper.setProps({ zIndex: 5 })
    expect(wrapper.find(Flex).first().prop('zIndex')).toBe(5)
  })

  it('should have a white content box', () => {
    const wrapper = shallow(<BaseModal />)
    const modal = wrapper.find(Flex).first()
    const content = modal.children(Box).first()

    expect({ ...content.props() }).toMatchObject({
      position: 'relative',
      backgroundColor: C_WHITE,
      maxHeight: '100%',
      width: '100%',
      overflowY: 'auto',
    })
  })

  it('should apply style props to content box', () => {
    const wrapper = shallow(<BaseModal maxWidth="32rem" />)
    const modal = wrapper.find(Flex).first()
    const content = modal.children(Box).first()

    expect(content.prop('maxWidth')).toBe('32rem')
  })

  it('should render a header bar if props.header is passed', () => {
    const header = <Text as="h3">Modal title</Text>
    const wrapper = shallow(<BaseModal header={header} />)
    const icon = wrapper.find(Text)
    const headerBar = icon.closest(Box)

    expect({ ...headerBar.props() }).toMatchObject({
      backgroundColor: C_LIGHT_GRAY,
      padding: '1rem',
      position: 'sticky',
      top: 0,
    })
  })

  it('should render a footer bar if props.footer is passed', () => {
    const footer = <Btn>button in the footer</Btn>
    const wrapper = shallow(<BaseModal footer={footer} />)
    const text = wrapper.find(Btn)
    const footerBar = text.closest(Box)

    expect({ ...footerBar.props() }).toMatchObject({
      backgroundColor: C_WHITE,
      padding: '1rem',
      position: 'sticky',
      bottom: 0,
    })
  })

  it('should render children in a padded box', () => {
    const wrapper = shallow(
      <BaseModal>
        <Text data-test="content">Hey there</Text>
      </BaseModal>
    )
    const text = wrapper.find('[data-test="content"]')
    const contentWrapper = text.closest(Box)

    expect({ ...contentWrapper.props() }).toMatchObject({
      paddingY: '1rem',
      paddingX: '2rem',
    })
  })
})
