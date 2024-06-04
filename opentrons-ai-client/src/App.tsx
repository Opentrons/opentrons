import React from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useTranslation } from 'react-i18next'
import { useForm, FormProvider } from 'react-hook-form'
import { useAtom } from 'jotai'
import {
  COLORS,
  Flex,
  Link as LinkButton,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  TYPOGRAPHY,
} from '@opentrons/components'

import { tokenAtom } from './resources/atoms'
import { useGetAccessToken } from './resources/hooks'
import { SidePanel } from './molecules/SidePanel'
import { Loading } from './molecules/Loading'
import { MainContentContainer } from './organisms/MainContentContainer'

export interface InputType {
  userPrompt: string
}

export function App(): JSX.Element | null {
  const { t } = useTranslation('protocol_generator')
  const { isAuthenticated, logout, isLoading, loginWithRedirect } = useAuth0()
  const [, setToken] = useAtom(tokenAtom)
  const { getAccessToken } = useGetAccessToken()

  const fetchAccessToken = async (): Promise<void> => {
    try {
      const accessToken = await getAccessToken()
      setToken(accessToken)
    } catch (error) {
      console.error('Error fetching access token:', error)
    }
  }
  const methods = useForm<InputType>({
    defaultValues: {
      userPrompt: '',
    },
  })

  React.useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      void loginWithRedirect()
    }
    if (isAuthenticated) {
      void fetchAccessToken()
    }
  }, [isAuthenticated, isLoading, loginWithRedirect])

  if (isLoading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <Flex
      position={POSITION_RELATIVE}
      minHeight="100vh"
      backgroundColor={COLORS.grey10}
    >
      <Flex position={POSITION_ABSOLUTE} top="1rem" right="1rem">
        <LinkButton
          onClick={() => logout()}
          textDecoration={TYPOGRAPHY.textDecorationUnderline}
        >
          {t('logout')}
        </LinkButton>
      </Flex>
      <FormProvider {...methods}>
        <SidePanel />
        <MainContentContainer />
      </FormProvider>
    </Flex>
  )
}
