import * as React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { CollapsibleSection } from '../'

describe('CollapsibleSection', () => {
  it('renders children by default', () => {
    render(
      <CollapsibleSection title="fakeTitle">
        section children
      </CollapsibleSection>
    )
    expect(screen.getByText('section children')).toBeInTheDocument()
  })
  it('renders title by default', () => {
    render(
      <CollapsibleSection title="fakeTitle">
        section children
      </CollapsibleSection>
    )
    expect(screen.getByText('fakeTitle')).toBeInTheDocument()
  })
  it('after clicking collapse icon, children are hidden', () => {
    render(
      <CollapsibleSection title="fakeTitle">
        section children
      </CollapsibleSection>
    )
    const collapseButton = screen.getByRole('button')
    fireEvent.click(collapseButton)
    expect(screen.queryByText('section children')).toBeNull()
  })
  it('initially collapsed if prop passed to override', () => {
    render(
      <CollapsibleSection title="fakeTitle" isExpandedInitially={false}>
        section children
      </CollapsibleSection>
    )
    expect(screen.queryByText('section children')).toBeNull()
  })
})
