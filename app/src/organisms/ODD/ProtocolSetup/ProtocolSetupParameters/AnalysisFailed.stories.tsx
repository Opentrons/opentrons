import { VIEWPORT } from '../../../../../../components/src/ui-style-constants'
import { AnalysisFailedModal } from './AnalysisFailedModal'

import type { Meta, Story } from '@storybook/react'
import type * as React from 'react'

export default {
  title: 'ODD/Organisms/AnalysisFailedModal',
  component: AnalysisFailedModal,
  parameters: VIEWPORT.touchScreenViewport,
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
