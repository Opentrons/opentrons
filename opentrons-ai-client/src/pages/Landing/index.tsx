import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useTranslation } from 'react-i18next'
import { FormProvider, useForm } from 'react-hook-form'
import { useAtom } from 'jotai'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  POSITION_ABSOLUTE,
  POSITION_RELATIVE,
  SPACING,
  StyledText,
  TYPOGRAPHY,
  Link as LinkButton,
} from '@opentrons/components'
import { tokenAtom } from '../../resources/atoms'
import { Loading } from '../../molecules/Loading'
import { useGetAccessToken } from '../../resources/hooks'
import welcomeImage from '../../assets/images/welcome_dashboard.png'

export interface InputType {
  userPrompt: string
}

export function Landing(): JSX.Element | null {
  const { t } = useTranslation('protocol_generator')
  const { isAuthenticated, logout, isLoading, loginWithRedirect } = useAuth0()
  const [, setToken] = useAtom(tokenAtom)
  const { getAccessToken } = useGetAccessToken()

  // const navigate = useNavigate()

  const LANDING_PAGE_TITLE = 'Welcome to OpentronsAI'
  const LANDING_PAGE_MESSAGE =
    'Get started building a prompt that will generate a Python protocol that you can use on your Opentrons robot. OpentronsAI lets you create and optimize your protocol by responding in natural language.'

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

  useEffect(() => {
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
        <Flex
          backgroundColor={COLORS.grey20}
          flexDirection={DIRECTION_COLUMN}
          alignItems={ALIGN_CENTER}
          justifyContent={JUSTIFY_CENTER}
          width="100%"
          gridGap={SPACING.spacing32}
        >
          <img
            src={welcomeImage}
            height="132px"
            width="548px"
            aria-label="welcome image"
          />
          <StyledText desktopStyle="headingLargeBold">
            {LANDING_PAGE_TITLE}
          </StyledText>
          <StyledText desktopStyle="headingSmallRegular">
            {LANDING_PAGE_MESSAGE}
          </StyledText>
        </Flex>
      </FormProvider>
    </Flex>
  )
}
