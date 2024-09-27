import type * as React from 'react'
import { Provider } from 'react-redux'
import { createStore } from 'redux'
import {
  DIRECTION_COLUMN,
  Flex,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  ModalShell,
} from '@opentrons/components'
import { Skeleton } from '/app/atoms/Skeleton'
import { WizardHeader } from '../WizardHeader'
import { configReducer } from '/app/redux/config/reducer'
import { GenericWizardTile } from './index'

import type { Store, StoreEnhancer } from 'redux'
import type { Story, Meta } from '@storybook/react'

const dummyConfig = {
  config: {
    isOnDevice: false,
  },
} as any

const store: Store<any> = createStore(
  configReducer,
  dummyConfig as StoreEnhancer
)

export default {
  title: 'App/Molecules/GenericWizardTile',
  component: GenericWizardTile,
} as Meta

const Template: Story<
  React.ComponentProps<typeof GenericWizardTile>
> = args => (
  <Provider store={store}>
    <ModalShell>
      <WizardHeader currentStep={3} totalSteps={4} title="Example Title" />
      <GenericWizardTile {...args} />
    </ModalShell>
  </Provider>
)
const body = (
  <LegacyStyledText as="p">
    {
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.'
    }
  </LegacyStyledText>
)
const rightHandBody = (
  <Flex flexDirection={DIRECTION_COLUMN}>
    <LegacyStyledText as="h1">{'You will need:'}</LegacyStyledText>
    <LegacyStyledText as="p" marginTop={SPACING.spacing16}>
      {'this'}
    </LegacyStyledText>
    <LegacyStyledText as="p">{'and this'}</LegacyStyledText>
    <LegacyStyledText as="p">{'and this'}</LegacyStyledText>
  </Flex>
)
const skeleton = (
  <Skeleton width="18rem" height="1.125rem" backgroundSize="47rem" />
)

const skeletons = (
  <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
    {skeleton}
    {skeleton}
    {skeleton}
    {skeleton}
  </Flex>
)

export const WithGetHelpLink = Template.bind({})
WithGetHelpLink.args = {
  rightHandBody: rightHandBody,
  bodyText: body,
  header: 'example header',
  getHelp: 'url for the help link',
  proceedButtonText: 'Continue',
}

export const WithBackButton = Template.bind({})
WithBackButton.args = {
  rightHandBody: rightHandBody,
  bodyText: body,
  header: 'example header',
  back: () => {
    console.log('back')
  },
  proceedButtonText: 'Continue',
}

export const WithSkeletons = Template.bind({})
WithSkeletons.args = {
  rightHandBody: (
    <Skeleton width="10.6875rem" height="15.5rem" backgroundSize="47rem" />
  ),
  bodyText: skeletons,
  header: <Skeleton width="17rem" height="1.75rem" backgroundSize="47rem" />,
  back: () => {
    console.log('back')
  },
  backIsDisabled: true,
  proceedButton: <PrimaryButton disabled={true}>{'Continue'}</PrimaryButton>,
}
