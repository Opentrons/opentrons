import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { ErrorUpdateSoftware } from '../ErrorUpdateSoftware'

const render = (props: React.ComponentProps<typeof ErrorUpdateSoftware>) => {
  return renderWithProviders(<ErrorUpdateSoftware {...props} />, {
    i18nInstance: i18n,
  })
}

describe('ErrorUpdateSoftware', () => {
  let props: React.ComponentProps<typeof ErrorUpdateSoftware>

  beforeEach(() => {
    props = {
      errorMessage: 'mock error message',
      children: (
        <div>
          <h1>{'mock child'}</h1>
        </div>
      ),
    }
  })

  it('should render text', () => {
    const [{ getByText }] = render(props)
    getByText('Software update error')
    getByText('mock error message')
  })
  it('should render provided children', () => {
    const [{ getByText }] = render(props)
    getByText('mock child')
  })
})
