import * as React from 'react'
import { nestedTextMatcher, renderWithProviders } from '@opentrons/components'
import { i18n } from '../../../../i18n'
import { AttachModule } from '../AttachModule'
import { mockHeaterShaker } from '../../../../redux/modules/__fixtures__'
import heaterShakerCommands from '@opentrons/shared-data/protocol/fixtures/6/heaterShakerCommands.json'
import { ProtocolModuleInfo } from '../../../Devices/ProtocolRun/utils/getProtocolModulesInfo'

const HEATER_SHAKER_PROTOCOL_MODULE_INFO = {
  moduleId: 'heater_shaker_id',
  x: 0,
  y: 0,
  z: 0,
  moduleDef: mockHeaterShaker as any,
  nestedLabwareDef: heaterShakerCommands.labwareDefinitions['example/plate/1'],
  nestedLabwareDisplayName: 'Source Plate',
  nestedLabwareId: null,
  protocolLoadOrder: 1,
  slotName: '1',
} as ProtocolModuleInfo

const render = (props: React.ComponentProps<typeof AttachModule>) => {
  return renderWithProviders(<AttachModule {...props} />, {
    i18nInstance: i18n,
  })[0]
}

describe('AttachModule', () => {
  let props: React.ComponentProps<typeof AttachModule>
  beforeEach(() => {
    props = {
      moduleFromProtocol: HEATER_SHAKER_PROTOCOL_MODULE_INFO,
    }
  })
  it('renders the correct title', () => {
    const { getByText } = render(props)

    getByText('Step 1 of 4: Attach module to deck')
  })

  it('renders the content and images correctly when page is not launched from a protocol', () => {
    props = {
      moduleFromProtocol: undefined,
    }
    const { getByText, getByAltText, getByTestId } = render(props)

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

  it('renders the correct slot number when a protocol with a heater shaker is provided', () => {
    const { getByText } = render(props)

    getByText(nestedTextMatcher('Place the module in Slot 1.'))
  })
})
