// import * as React from 'react'
// import { renderWithProviders } from '@opentrons/components'
// import { SoftwareKeyboard } from '..'

// const render = (props: React.ComponentProps<typeof SoftwareKeyboard>) => {
//   const mockRef = React.useRef(null)

//   return renderWithProviders(<SoftwareKeyboard {...props} />)[0]
// }

// describe('SoftwareKeyboard', () => {
//   const props: React.ComponentProps<typeof SoftwareKeyboard> = {
//     onChange: jest.fn(),
//     keyboardRef: mockRef,
//   }
//   it('should render the software keyboard', () => {
//     const { getByRole } = render(props)
//     getByRole('button', { name: 'a' })
//     getByRole('button', { name: 'shift' })
//     getByRole('button', { name: 'space' })
//   })
// })
