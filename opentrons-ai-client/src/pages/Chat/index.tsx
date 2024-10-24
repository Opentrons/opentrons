import { useForm, FormProvider } from 'react-hook-form'
import { COLORS, Flex, POSITION_RELATIVE } from '@opentrons/components'

import { SidePanel } from '../../molecules/SidePanel'
import { MainContentContainer } from '../../organisms/MainContentContainer'

export interface InputType {
  userPrompt: string
}

export function Chat(): JSX.Element | null {
  const methods = useForm<InputType>({
    defaultValues: {
      userPrompt: '',
    },
  })

  return (
    <Flex
      position={POSITION_RELATIVE}
      minHeight="100vh"
      backgroundColor={COLORS.grey10}
    >
      <FormProvider {...methods}>
        {/* <SidePanel /> */}
        <MainContentContainer />
      </FormProvider>
    </Flex>
  )
}
