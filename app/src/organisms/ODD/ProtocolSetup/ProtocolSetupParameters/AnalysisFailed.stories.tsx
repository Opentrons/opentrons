import { QueryClient, QueryClientProvider } from 'react-query'
import { MemoryRouter } from 'react-router-dom'

import { VIEWPORT } from '../../../../../../components/src/ui-style-constants'
import { AnalysisFailedModal } from './AnalysisFailedModal'

import type { Meta, Story } from '@storybook/react'

const queryClient = new QueryClient()

export default {
  title: 'ODD/Organisms/AnalysisFailedModal',
  component: AnalysisFailedModal,
  ...VIEWPORT.touchScreenViewport,
  decorators: [
    Story => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
} as Meta

const Template: Story<
  React.ComponentProps<typeof AnalysisFailedModal>
> = args => <AnalysisFailedModal {...args} />

export const AnalysisFailed = Template.bind({})
AnalysisFailed.args = {
  errors: [
    'analysis failed reason message 1',
    'analysis failed reason message 2',
  ],
  protocolId: 'mockProtocolId',
  setShowAnalysisFailedModal: () => {},
}
