import * as React from 'react'
import { renderWithProviders, COLORS } from '@opentrons/components'
import { ModalHeader } from '../ModalHeader'
import { Modal } from '../Modal'

jest.mock('../ModalHeader')

const mockModalHeader = ModalHeader as jest.MockedFunction<typeof ModalHeader>
const render = (props: React.ComponentProps<typeof Modal>) => {
  return renderWithProviders(<Modal {...props} />)[0]
}

describe('Modal', () => {
  let props: React.ComponentProps<typeof Modal>
  beforeEach(() => {
    props = {
      onOutsideClick: jest.fn(),
      children: <div>children</div>,
    }
    mockModalHeader.mockReturnValue(<div>mock Modal Header</div>)
  })
  it('should render the modal with no header', () => {
    const { getByText, getByLabelText, queryByText } = render(props)
    getByText('children')
    getByLabelText('modal_medium')
    expect(queryByText('mock Modal Header')).not.toBeInTheDocument()
  })
  it('should render the modal with header and large modal size', () => {
    props = {
      ...props,
      modalSize: 'large',
      header: { title: 'title' },
    }
    const { getByText, getByLabelText } = render(props)
    getByText('children')
    getByLabelText('modal_large')
    getByText('mock Modal Header')
  })
  it('should render the modal with small modal size', () => {
    props = {
      ...props,
      modalSize: 'small',
    }
    const { getByText, getByLabelText } = render(props)
    getByText('children')
    getByLabelText('modal_small')
  })
  it('presses the background overlay and calls onoutsideClick', () => {
    const { getByLabelText } = render(props)
    getByLabelText('BackgroundOverlay').click()
    expect(props.onOutsideClick).toHaveBeenCalled()
  })
  it('renders red background when isError is true', () => {
    props = {
      ...props,
      isError: true,
    }
    const { getByLabelText } = render(props)
    expect(getByLabelText('modal_medium')).toHaveStyle(
      `backgroundColor: ${COLORS.red2}`
    )
  })
})
