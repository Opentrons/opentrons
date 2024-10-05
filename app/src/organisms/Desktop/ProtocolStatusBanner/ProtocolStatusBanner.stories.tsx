import { ProtocolStatusBanner as ProtocolStatusBannerComponent } from './index'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ProtocolStatusBannerComponent> = {
  title: 'App/Organisms/ProtocolStatusBanner',
  component: ProtocolStatusBannerComponent,
}
export default meta

type Story = StoryObj<typeof ProtocolStatusBannerComponent>

export const ProtocolStatusBanner: Story = {}
