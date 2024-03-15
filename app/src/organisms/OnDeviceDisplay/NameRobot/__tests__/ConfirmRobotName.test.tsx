import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '../../../../__testing-utils__'
import { i18n } from '../../../../i18n'
import { ConfirmRobotName } from '../ConfirmRobotName'

import type { useHistory } from 'react-router-dom'

const mockPush = vi.fn()

vi.mock('react-router-dom', async importOriginal => {
  const actual = await importOriginal<typeof useHistory>()
  return {
    ...actual,
    useHistory: () => ({ push: mockPush } as any),
  }
})

const render = (props: React.ComponentProps<typeof ConfirmRobotName>) => {
  return renderWithProviders(
    <MemoryRouter>
      <ConfirmRobotName {...props} />
    </MemoryRouter>,
    {
      i18nInstance: i18n,
    }
  )
}

describe('ConfirmRobotName', () => {
  let props: React.ComponentProps<typeof ConfirmRobotName>
  beforeEach(() => {
    props = {
      robotName: 'otie',
    }
  })

  it('should render text, an image and a button', () => {
    render(props)
    screen.getByText('otie, love it!')
    screen.getByText('Your robot is ready to go.')
    screen.getByText('Finish setup')
  })

  it('when tapping a button, call a mock function', () => {
    render(props)
    const button = screen.getByText('Finish setup')
    fireEvent.click(button)
    expect(mockPush).toBeCalledWith('/dashboard')
  })
})
