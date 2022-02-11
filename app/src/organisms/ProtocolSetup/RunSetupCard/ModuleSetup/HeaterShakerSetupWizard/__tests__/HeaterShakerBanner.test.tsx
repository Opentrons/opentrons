import * as React from 'react'
import { i18n } from '../../../../../../i18n'
import { renderWithProviders } from '@opentrons/components'
import { Banner } from '../../../../../../atoms/Banner/Banner'
import { HeaterShakerBanner } from '../HeaterShakerBanner'

jest.mock('../../../../../../atoms/Banner/Banner')

const mockBanner = Banner as jest.MockedFunction<typeof Banner>

const render = (props: React.ComponentProps<typeof HeaterShakerBanner>) => {
  return renderWithProviders(<HeaterShakerBanner {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('HeaterShakerBanner', () => {
  let props: React.ComponentProps<typeof HeaterShakerBanner>
  beforeEach(() => {
    props = { model: 'HeaterShakerV1' }
    mockBanner.mockReturnValue(<div>mock banner</div>)
  })

  it('should render banner component', () => {
    const { getByText } = render(props)
    getByText('mock banner')
  })
})
