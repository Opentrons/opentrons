import * as React from 'react'
import { i18n } from '../../../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { UnMatchedModuleWarning } from '../UnMatchedModuleWarning'

const render = (props: React.ComponentProps<typeof UnMatchedModuleWarning>) => {
  return renderWithProviders(<UnMatchedModuleWarning {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('UnMatchedModuleWarning', () => {
  let props: React.ComponentProps<typeof UnMatchedModuleWarning>
  beforeEach(() => {
    props = { isAnyModuleUnnecessary: true }
  })

  it('should render the correct title', () => {
    const { getByText, getByLabelText } = render(props)
    getByText(
      'This robot has connected modules that are not specified in this protocol'
    )
    getByLabelText('information_icon')
  })
  it('should render the correct body', () => {
    const { getByText } = render(props)
    getByText(
      'If you’re having trouble connecting the modules specified below, make sure the module’s generation (GEN1 vs GEN2) is correct.'
    )
  })

  it('should not render text when boolean is false', () => {
    props = { isAnyModuleUnnecessary: false }
    const { queryByText } = render(props)
    expect(
      queryByText(
        'This robot has connected modules that are not specified in this protocol'
      )
    ).toBeNull()
  })
})
