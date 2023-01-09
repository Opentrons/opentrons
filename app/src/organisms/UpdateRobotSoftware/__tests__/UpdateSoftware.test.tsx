import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { UpdateSoftware } from '../UpdateSoftware'

const render = (props: React.ComponentProps<typeof UpdateSoftware>) => {
  return renderWithProviders(<UpdateSoftware {...props} />, {
    i18nInstance: i18n,
  })
}

describe('UpdateSoftware', () => {
  let props: React.ComponentProps<typeof UpdateSoftware>
  beforeEach(() => {
    props = {
      processProgress: 50,
    }
  })
  it('should render text and progressbar - downloading software', () => {
    props = {
      ...props,
      downloading: true,
    }
    const [{ getByText, getByRole }] = render(props)
    getByText('Downloading software...')
  })
  it('should render text and progressbar - validating software', () => {
    props = {
      ...props,
      validating: true,
    }
    const [{ getByText, getByRole }] = render(props)
    getByText('Validating software...')
  })
  it('should render text and progressbar - installing software', () => {
    const [{ getByText, getByRole }] = render(props)
    getByText('Installing software...')
  })
})
