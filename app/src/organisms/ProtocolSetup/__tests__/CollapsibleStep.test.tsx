import * as React from 'react'
import { renderWithProviders } from '@opentrons/components/__utils__'

import { i18n } from '../../../i18n'
import { CollapsibleStep } from '../CollapsibleStep'

describe('CollapsibleStep', () => {
  let render: (
    props?: Partial<React.ComponentProps<typeof CollapsibleStep>>
  ) => ReturnType<typeof renderWithProviders>
  let toggleExpandedMock: jest.MockedFunction<() => void>

  beforeEach(() => {
    toggleExpandedMock = jest.fn()
    render = ({
      expanded = true,
      title = 'stub title',
      description = 'stub description',
      label = 'stub label',
      toggleExpanded = toggleExpandedMock,
      children = <button>stub children</button>,
    } = {}) => {
      return renderWithProviders(
        <CollapsibleStep
          {...{ expanded, title, description, label, toggleExpanded, children }}
        />,
        { i18nInstance: i18n }
      )
    }
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('renders children if expanded is true', () => {
    const { getByRole } = render()
    expect(getByRole('button', { name: 'stub children' })).toBeTruthy()
  })
  it('does not render children if expanded is false', () => {
    const { queryByRole } = render({ expanded: false })
    expect(queryByRole('button')).toBeNull()
  })
})
