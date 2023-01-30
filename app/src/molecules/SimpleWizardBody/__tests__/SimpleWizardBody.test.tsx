import * as React from 'react'
import { COLORS, renderWithProviders } from '@opentrons/components'
import { Skeleton } from '../../../atoms/Skeleton'
import { SimpleWizardBody } from '..'

jest.mock('../../../atoms/Skeleton')

const mockSkeleton = Skeleton as jest.MockedFunction<typeof Skeleton>

const render = (props: React.ComponentProps<typeof SimpleWizardBody>) => {
  return renderWithProviders(<SimpleWizardBody {...props} />)[0]
}
describe('SimpleWizardBody', () => {
  let props: React.ComponentProps<typeof SimpleWizardBody>
  beforeEach(() => {
    props = {
      iconColor: COLORS.errorText,
      children: <div>children</div>,
      header: 'header',
      subHeader: 'subheader',
      isSuccess: false,
    }
  })
  it('renders the correct information when it is not success', () => {
    const { getByText, getByLabelText } = render(props)
    getByText('header')
    getByText('subheader')
    getByLabelText('ot-alert')
  })

  it('renders the correct information when it is success', () => {
    props = {
      ...props,
      isSuccess: true,
    }
    const { getByText, getByLabelText } = render(props)
    getByText('header')
    getByText('subheader')
    getByLabelText('ot-check')
  })
  it('renders a few skeletons  when it is pending', () => {
    props = {
      ...props,
      isPending: true,
    }
    mockSkeleton.mockReturnValue(<div>mock skeleton</div>)
    const { getAllByText } = render(props)
    getAllByText('mock skeleton')
  })
})
