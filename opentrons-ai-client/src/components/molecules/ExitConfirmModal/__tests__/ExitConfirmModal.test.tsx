import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/ai-client/__testing-utils__'
import { i18n } from '/ai-client/i18n'
import { displayExitConfirmModalAtom } from '/ai-client/resources/atoms'

import { ExitConfirmModal } from '../index'

import type { NavigateFunction } from 'react-router-dom'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<NavigateFunction>()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const initialValuesMock = [[displayExitConfirmModalAtom, true]]

const render = (): ReturnType<typeof renderWithProviders> => {
  return renderWithProviders(<ExitConfirmModal />, {
    initialValues: initialValuesMock as any,
    i18nInstance: i18n,
  })
}

describe('ExitConfirmModal', () => {
  it('should render ExitConfirmModal component', () => {
    render()

    screen.getByText('Are you sure you want to exit?')
    screen.getByText('Exiting now will discard your progress.')
  })

  it('should close modal when continue button is clicked', () => {
    render()

    const continueButton = screen.getByText('Continue editing')
    fireEvent.click(continueButton)

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(
      screen.queryByText('Are you sure you want to exit?')
    ).not.toBeInTheDocument()
  })

  it('should close modal and navigate to / when exit button is clicked', () => {
    render()

    const exitButton = screen.getByText('Exit without saving')
    fireEvent.click(exitButton)

    expect(mockNavigate).toHaveBeenCalledWith('/')
    expect(
      screen.queryByText('Are you sure you want to exit?')
    ).not.toBeInTheDocument()
  })
})
