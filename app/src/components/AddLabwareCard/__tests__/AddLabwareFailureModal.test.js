// @flow
import { AlertModal } from '@opentrons/components'
import { mount, shallow } from 'enzyme'
import * as React from 'react'

import * as LabwareFixtures from '../../../custom-labware/__fixtures__'
import { Portal } from '../../portal'
import {
  AddLabwareFailureModal,
  AddLabwareFailureModalTemplate,
} from '../AddLabwareFailureModal'

describe('AddLabwareFailureModal', () => {
  const mockDirectory = '/path/to/labware'
  const mockOnCancel = jest.fn()
  const mockOnOverwrite = jest.fn()
  const emptyProps = {
    directory: mockDirectory,
    file: null,
    errorMessage: null,
    onCancel: mockOnCancel,
    onOverwrite: mockOnOverwrite,
  }

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders inside a Portal', () => {
    const wrapper = shallow(<AddLabwareFailureModal {...emptyProps} />)
    const portal = wrapper.find(Portal)
    const modal = portal.find(AddLabwareFailureModalTemplate)

    expect(modal.props()).toEqual(emptyProps)
  })

  it('renders an AlertModal', () => {
    const wrapper = shallow(<AddLabwareFailureModalTemplate {...emptyProps} />)

    expect(wrapper.exists(AlertModal)).toBe(true)
  })

  it('renders a cancel button that calls props.onCancel', () => {
    const wrapper = mount(<AddLabwareFailureModalTemplate {...emptyProps} />)
    const button = wrapper.findWhere(
      c => c.type() === 'button' && c.text().toLowerCase() === 'cancel'
    )

    button.invoke('onClick')()
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('renders proper title for error', () => {
    const wrapper = mount(
      <AddLabwareFailureModalTemplate {...emptyProps} errorMessage="AHHH!" />
    )
    const html = wrapper.html()

    expect(wrapper.find(AlertModal).prop('heading')).toEqual(
      'Unable to add labware'
    )
    expect(html).toMatch(/Unable to copy labware/)
    expect(html).toContain('AHHH!')
  })

  describe('invalid files', () => {
    const render = file => {
      return mount(
        <AddLabwareFailureModalTemplate {...emptyProps} file={file} />
      )
    }

    it('renders proper copy for invalid file', () => {
      const file = LabwareFixtures.mockInvalidLabware
      const wrapper = render(file)
      const html = wrapper.html()

      expect(wrapper.find(AlertModal).prop('heading')).toEqual(
        'Invalid labware definition'
      )
      expect(html).toMatch(/not a valid Opentrons labware definition/)
      expect(html).toContain(file.filename)
    })

    it('renders proper copy for an Opentrons conflicting file', () => {
      const file = LabwareFixtures.mockOpentronsLabware
      const wrapper = render(file)
      const html = wrapper.html()

      expect(wrapper.find(AlertModal).prop('heading')).toEqual(
        'Conflict with Opentrons labware'
      )
      expect(wrapper.html()).toMatch(
        /conflicts with an Opentrons standard definition/
      )
      expect(html).toContain(file.definition.metadata.displayName)
      expect(html).toContain(file.definition.parameters.loadName)
      expect(html).toContain(file.filename)
    })

    it('renders proper copy for an duplicate file', () => {
      const file = LabwareFixtures.mockDuplicateLabware
      const wrapper = render(file)
      const html = wrapper.html()

      expect(wrapper.find(AlertModal).prop('heading')).toEqual(
        'Overwrite duplicate labware?'
      )
      expect(html).toMatch(/already exists/)
      expect(html).toContain(file.definition.metadata.displayName)
      expect(html).toContain(file.definition.parameters.loadName)
      expect(html).toContain(file.filename)
    })

    it('duplicate file adds overwrite button', () => {
      const file = LabwareFixtures.mockDuplicateLabware
      const wrapper = render(file)
      const button = wrapper.findWhere(
        c => c.type() === 'button' && /overwrite/i.test(c.text())
      )

      button.invoke('onClick')()
      expect(mockOnOverwrite).toHaveBeenCalledWith(file)
    })
  })
})
