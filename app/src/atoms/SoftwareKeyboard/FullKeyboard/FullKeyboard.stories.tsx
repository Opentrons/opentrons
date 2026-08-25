import { useRef, useState } from 'react'
import { Provider } from 'react-redux'
import { legacy_createStore } from 'redux'

import {
  DIRECTION_COLUMN,
  Flex,
  InputField,
  POSITION_ABSOLUTE,
  SPACING,
  VIEWPORT,
} from '@opentrons/components'

import { configReducer } from '/app/redux/config/reducer'

import { FullKeyboard } from '.'

import type { Meta, StoryObj } from '@storybook/react'
import type { Store, StoreEnhancer } from 'redux'
import type { ReactNode } from 'react'

const dummyConfig = {
  config: {
    isOnDevice: false,
    language: {
      appLanguage: 'en',
      systemLanguage: null,
    },
  },
} as any
const store: Store<any> = legacy_createStore(
  configReducer,
  dummyConfig as StoreEnhancer
)

const meta: Meta<typeof FullKeyboard> = {
  title: 'ODD/Atoms/SoftwareKeyboard/FullKeyboard',
  component: FullKeyboard,
  ...VIEWPORT.touchScreenViewport,
  decorators: [
    Story => (
      <Provider store={store}>
        <Story />
      </Provider>
    ),
  ],
}
export default meta

type Story = StoryObj<typeof FullKeyboard>

const Keyboard = (): ReactNode => {
  const [showKeyboard, setShowKeyboard] = useState(false)
  const [value, setValue] = useState<string>('')
  const keyboardRef = useRef(null)
  return (
    <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing16}>
      <form id="test_form">
        <InputField
          value={value}
          type="text"
          placeholder="When focusing, the keyboard shows up"
          // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
          onFocus={() => setShowKeyboard(true)}
        />
      </form>
      <Flex position={POSITION_ABSOLUTE} top="20%" left="0" width="64rem">
        {showKeyboard && (
          <FullKeyboard
            // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
            onChange={e => e != null && setValue(String(e))}
            keyboardRef={keyboardRef}
          />
        )}
      </Flex>
    </Flex>
  )
}

export const FullSoftwareKeyboard: Story = {
  render: () => <Keyboard />,
}
