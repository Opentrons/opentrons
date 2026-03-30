import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { PAUSE_UNTIL_RESUME } from '/protocol-designer/constants'
import { renameStep } from '/protocol-designer/labware-ingred/actions'

import { RenameStepModal } from '..'

import type { ComponentProps } from 'react'

vi.mock('/protocol-designer/labware-ingred/actions')

const render = (props: ComponentProps<typeof RenameStepModal>) => {
  return renderWithProviders(<RenameStepModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('EditNickNameModal', () => {
  let props: ComponentProps<typeof RenameStepModal>

  beforeEach(() => {
    props = {
      onClose: vi.fn(),
      formData: {
        stepType: 'pause',
        id: 'test_id',
        pauseAction: PAUSE_UNTIL_RESUME,
        description: 'some description',
        pauseMessage: 'some message',
        stepName: 'pause',
        stepDetails: '',
      },
    }
  })

  // ToDo This test is missing a few base test cases
  it('renders the text and add a step name and a step notes', () => {
    render(props)
    screen.getByText('Name step')
    screen.getByText('Step Name')
    screen.getByText('Step Notes')

    fireEvent.click(screen.getByText('Cancel'))
    expect(props.onClose).toHaveBeenCalled()

    expect(screen.getAllByRole('textbox').length).toBe(2)
    screen.getByDisplayValue('Pause')

    fireEvent.click(screen.getByText('Save'))
    expect(vi.mocked(renameStep)).toHaveBeenCalled()
    expect(props.onClose).toHaveBeenCalled()
  })

  it('renders the too long step name error', () => {
    render(props)
    const stepName = screen.getAllByRole('textbox', { name: '' })[0]
    fireEvent.change(stepName, {
      target: {
        value:
          'mockStepNameisthelongeststepnameihaveeverseen mockstepNameisthelongeststepnameihaveeverseen mockstepNameisthelongest',
      },
    })
    screen.getByText('Oops! Your step name is too long.')
  })
})
