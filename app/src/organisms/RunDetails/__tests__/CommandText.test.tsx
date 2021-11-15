import * as React from 'react'
import { renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../i18n'
import { CommandText } from '../CommandText'

const render = (props: React.ComponentProps<typeof CommandText>) => {
  return renderWithProviders(<CommandText {...props} />, {
    i18nInstance: i18n,
  })[0]
}

const COMMAND_TEXT = ('COMMAND_TEXT' as unknown) as JSX.Element

describe('CommandText', () => {
  let props: React.ComponentProps<typeof CommandText>

  beforeEach(() => {
    props = {
      commandText: COMMAND_TEXT,
    }
  })
  it('renders correct command text', () => {
    const { getByText } = render(props)
    getByText('COMMAND_TEXT')
  })
})
