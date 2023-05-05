import * as React from 'react'
import { fireEvent, render } from '@testing-library/react'

import { CollapsibleSection } from '../'

describe('CollapsibleSection', () => {
  it('renders children by default', () => {
    const { queryByText } = render(
      <CollapsibleSection title="fakeTitle">
        section children
      </CollapsibleSection>
    )
    expect(queryByText('section children')).toBeInTheDocument()
  })
  it('renders title by default', () => {
    const { queryByText } = render(
      <CollapsibleSection title="fakeTitle">
        section children
      </CollapsibleSection>
    )
    expect(queryByText('fakeTitle')).toBeInTheDocument()
  })
  it('after clicking collapse icon, children are hidden', () => {
    const { queryByRole, queryByText } = render(
      <CollapsibleSection title="fakeTitle">
        section children
      </CollapsibleSection>
    )
    const collapseButton = queryByRole('button')
    collapseButton != null && fireEvent.click(collapseButton)
    expect(queryByText('section children')).toBeFalsy()
  })
  it('initially collapsed if prop passed to override', () => {
    const { queryByText } = render(
      <CollapsibleSection title="fakeTitle" isExpandedInitially={false}>
        section children
      </CollapsibleSection>
    )
    expect(queryByText('section children')).toBeFalsy()
  })
})
