import { I18nextProvider } from 'react-i18next'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'

import { VIEWPORT } from '@opentrons/components'
import { fixture96Plate } from '@opentrons/shared-data'

import { LabwareCard as LabwareCardComponent } from '.'
import { i18n } from '../../../assets/localization'
import { configureStore } from '../../../configureStore'

import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps } from 'react'
import type { LabwareDefinition2 } from '@opentrons/shared-data'

const store = configureStore()

const meta: Meta<typeof LabwareCardComponent> = {
  title: 'Protocol-Designer/Organisms/LabwareCard',
  component: LabwareCardComponent,
  parameters: VIEWPORT.touchScreenViewport,
  decorators: [
    Story => (
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <MemoryRouter>
            <Story />
          </MemoryRouter>
        </I18nextProvider>
      </Provider>
    ),
  ],
  argTypes: {},
}

export default meta
type Story = StoryObj<typeof LabwareCardComponent>

export const LabwareCardField: Story = (
  args: ComponentProps<typeof LabwareCardComponent>
) => {
  return <LabwareCardComponent {...args} />
}

LabwareCardField.args = {
  labware: {
    id: 'mockId',
    labwareDefURI: `${fixture96Plate.namespace}/${fixture96Plate.parameters.loadName}/${fixture96Plate.version}`,
    def: fixture96Plate as LabwareDefinition2,
    pythonName: 'mockPythonName',
    stack: ['mockId', 'A1'],
  },
  lidId: 'mockLidId',
}
