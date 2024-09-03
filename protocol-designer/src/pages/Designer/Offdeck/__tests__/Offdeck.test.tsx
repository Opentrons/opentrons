import * as React from 'react'
import { describe, it, vi } from 'vitest'
import '@testing-library/jest-dom/vitest'
import { screen } from '@testing-library/react'
import { OffDeck } from '../Offdeck'
import { renderWithProviders } from '../../../../__testing-utils__'
import { OffDeckDetails } from '../OffDeckDetails'

vi.mock('../OffDeckDetails')
const render = () => {
  return renderWithProviders(<OffDeck />)[0]
}

describe('OffDeck', () => {
  it('renders off deck details', () => {
    vi.mocked(OffDeckDetails).mockReturnValue(<div>mock off deck details</div>)
    render()
    screen.getByText('mock off deck details')
  })
})
