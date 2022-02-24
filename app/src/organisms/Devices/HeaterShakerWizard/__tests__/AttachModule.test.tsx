import * as React from 'react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { AttachModule } from '../AttachModule'

const render = (props: React.ComponentProps<typeof AttachModule>) => {
  return renderWithProviders(<AttachModule {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AttachModule', () => {
  it('renders the correct title', () => {
    const { getByText } = render({})

    getByText('Step 1 of 4: Attach module to deck')
  })

  it('renders the content and images correctly', () => {
    const { getByText, getByAltText, getByTestId } = render({})

    getByText(
      nestedTextMatcher(
        'Before placing the module on the deck, make sure the anchors are not extended.'
      )
    )
    getByText(
      nestedTextMatcher(
        'Turn screws  counter clockwise to retract the anchors. The screws should not come out of the module.'
      )
    )
    getByText(
      nestedTextMatcher(
        'Orient your module such that the plugs for power and USB connection are outward.'
      )
    )
    getByText(
      nestedTextMatcher(
        'Hold the module flat against the deck and turn screws  clockwise to extend the anchors.'
      )
    )
    getByText(
      nestedTextMatcher(
        'Check attachment by gently pulling up and rocking the module.'
      )
    )
    getByText('Place the module in a Slot.')
    getByText('1a')
    getByText('1b')
    getByText('1c')
    getByAltText('Attach Module to Deck')
    getByAltText('screwdriver_1a')
    getByAltText('screwdriver_1b')
    getByTestId('HeaterShakerWizard_deckMap')
  })

  it('renders the correct slot number when a slot is provided', () => {
    const { getByText } = render({ slotName: '1' })

    getByText(nestedTextMatcher('Place the module in Slot 1.'))
  })
})
