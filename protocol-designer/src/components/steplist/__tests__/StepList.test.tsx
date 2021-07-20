import React from 'react'
import { shallow } from 'enzyme'
import { StepList, StepListProps } from '..'
import { MultiSelectToolbar } from '../MultiSelectToolbar'

describe('StepList', () => {
  let props: StepListProps
  beforeEach(() => {
    props = {
      isMultiSelectMode: true,
      orderedStepIds: [],
      reorderSelectedStep: () => null,
      reorderSteps: () => null,
    }
  })
  const render = (props: StepListProps) => shallow(<StepList {...props} />)

  it('should render the MultiSelectToolbar in MultiSelectMode', () => {
    props.isMultiSelectMode = true
    const wrapper = render(props)
    expect(wrapper.find(MultiSelectToolbar).prop('isMultiSelectMode')).toBe(
      true
    )
  })
  it('should NOT render the MultiSelectToolbar in NOT MultiSelectMode', () => {
    props.isMultiSelectMode = false
    const wrapper = render(props)
    expect(wrapper.find(MultiSelectToolbar).prop('isMultiSelectMode')).toBe(
      false
    )
  })
})
