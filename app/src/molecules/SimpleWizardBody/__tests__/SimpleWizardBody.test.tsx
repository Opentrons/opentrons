import * as React from 'react'
import { screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { COLORS } from '@opentrons/components'
import { renderWithProviders } from '../../../__testing-utils__'
import { Skeleton } from '../../../atoms/Skeleton'
import { getIsOnDevice } from '../../../redux/config'
import { SimpleWizardBody } from '..'

vi.mock('../../../atoms/Skeleton')
vi.mock('../../../redux/config')

const mockSkeleton = Skeleton as jest.MockedFunction<typeof Skeleton>
const mockGetIsOnDevice = getIsOnDevice as jest.MockedFunction<
  typeof getIsOnDevice
>

const render = (props: React.ComponentProps<typeof SimpleWizardBody>) => {
  return renderWithProviders(<SimpleWizardBody {...props} />)[0]
}
describe('SimpleWizardBody', () => {
  let props: React.ComponentProps<typeof SimpleWizardBody>
  beforeEach(() => {
    props = {
      iconColor: COLORS.red60,
      children: <div>children</div>,
      header: 'header',
      subHeader: 'subheader',
      isSuccess: false,
    }
    mockGetIsOnDevice.mockReturnValue(false)
  })
  it('renders the correct information when it is not success', () => {
    render(props)
    screen.getByText('header')
    screen.getByText('subheader')
    screen.getByLabelText('ot-alert')
  })
  it('renders the correct information for on device display', () => {
    mockGetIsOnDevice.mockReturnValue(true)
    render(props)
    screen.getByText('header')
    screen.getByText('subheader')
    screen.getByLabelText('ot-alert')
  })
  it('renders the correct information when it is success', () => {
    props = {
      ...props,
      isSuccess: true,
    }
    render(props)
    screen.getByText('header')
    screen.getByText('subheader')
    const image = screen.getByRole('img', { name: 'Success Icon' })
    expect(image.getAttribute('src')).toEqual(
      '/app/src/assets/images/icon_success.png'
    )
  })
  it('renders a few skeletons  when it is pending', () => {
    props = {
      ...props,
      isPending: true,
    }
    mockSkeleton.mockReturnValue(<div>mock skeleton</div>)
    render(props)
    screen.getAllByText('mock skeleton')
  })
})
