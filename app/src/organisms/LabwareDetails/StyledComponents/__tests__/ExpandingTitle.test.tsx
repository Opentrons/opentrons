import * as React from 'react'
import { fireEvent } from '@testing-library/react'
import { renderWithProviders, getFootprintDiagram } from '@opentrons/components'
import { ExpandingTitle } from '../ExpandingTitle'

const render = (props: React.ComponentProps<typeof ExpandingTitle>) => {
  return renderWithProviders(<ExpandingTitle {...props} />)
}

const diagram = getFootprintDiagram({})
const DIAGRAM_TEST_ID = 'expanding_title_diagram'

describe('ExpandingTitle', () => {
  let props: React.ComponentProps<typeof ExpandingTitle>
  beforeEach(() => {
    props = {
      label: 'Title',
      diagram,
    }
  })

  it('renders correct label and button but does not render diagram initially', () => {
    const [{ getByText, getByRole, queryByTestId }] = render(props)

    getByText('Title')
    getByRole('button')
    expect(queryByTestId(DIAGRAM_TEST_ID)).not.toBeInTheDocument()
  })

  it('toggles rendering of diagram when button is clicked', () => {
    const [{ getByRole, getByTestId, queryByTestId }] = render(props)

    const button = getByRole('button')
    fireEvent.click(button)
    getByTestId(DIAGRAM_TEST_ID)
    fireEvent.click(button)
    expect(queryByTestId(DIAGRAM_TEST_ID)).not.toBeInTheDocument()
  })
})
