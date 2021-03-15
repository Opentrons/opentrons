// @flow
import React from 'react'
import { shallow } from 'enzyme'
import { StepList } from '..'
import { MultiSelectToolbar } from '../MultiSelectToolbar'

describe('StepList', () => {
  let props
  beforeEach(() => {
    props = {
      isMultiSelectMode: true,
      orderedStepIds: [],
      reorderSelectedStep: () => null,
      reorderSteps: () => null,
    }
  })
  const render = props => shallow(<StepList {...props} />)

  it('should render a MultiSelectToolbar when in multi select mode', () => {
    props.isMultiSelectMode = true
    const wrapper = render(props)
    expect(wrapper.find(MultiSelectToolbar).exists()).toBe(true)
  })
  // TODO IMMEDIATELY (ka): This component is always present now due to css transitions,
  // figure out a way to test collapsed style if animation is desired
  it('should pass isMultiSelectMode prop to MultiSelectToolbar', () => {
    props.isMultiSelectMode = false
    const wrapper = render(props)
    expect(wrapper.find(MultiSelectToolbar).prop('isMultiSelectMode')).toBe(
      false
    )
  })
})
