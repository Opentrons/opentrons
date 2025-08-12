import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fixture96Plate } from '@opentrons/shared-data'

import { renderWithProviders } from '/protocol-designer/__testing-utils__'
import { i18n } from '/protocol-designer/assets/localization'
import { renameLabware } from '/protocol-designer/labware-ingred/actions'
import { getLabwareEntities } from '/protocol-designer/step-forms/selectors'
import { getLabwareNicknamesById } from '/protocol-designer/ui/labware/selectors'

import { EditNickNameModal } from '..'

import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

vi.mock('/protocol-designer/ui/labware/selectors')
vi.mock('/protocol-designer/labware-ingred/actions')
vi.mock('/protocol-designer/step-forms/selectors')
const render = (props: ComponentProps<typeof EditNickNameModal>) => {
  return renderWithProviders(<EditNickNameModal {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('EditNickNameModal', () => {
  let props: ComponentProps<typeof EditNickNameModal>

  beforeEach(() => {
    props = {
      onClose: vi.fn(),
      labwareId: 'mockId',
    }
    vi.mocked(getLabwareNicknamesById).mockReturnValue({
      mockId: 'mockOriginalName',
    })
    vi.mocked(getLabwareEntities).mockReturnValue({
      mockId: {
        id: 'mockId',
        labwareDefURI: 'mockDefUri',
        pythonName: 'mockPythonName',
        def: fixture96Plate as LabwareDefinition2,
      },
    })
  })

  it('renders the text and adds a nickname', () => {
    render(props)
    screen.getByText('Rename labware')
    screen.getByText('Labware name')
    screen.getByText('Reset')

    fireEvent.click(screen.getByText('Cancel'))
    expect(props.onClose).toHaveBeenCalled()

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'mockNickName' } })
    fireEvent.click(screen.getByText('Save'))
    expect(vi.mocked(renameLabware)).toHaveBeenCalled()
    expect(props.onClose).toHaveBeenCalled()
  })
  it('renders the too long nickname error', () => {
    render(props)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, {
      target: {
        value:
          'mockNickNameisthelongestnicknameihaveeverseen mockNickNameisthelongestnicknameihaveeverseen mockNickNameisthelongest',
      },
    })
    screen.getByText('Labware names must be 115 characters or fewer.')
  })
})
