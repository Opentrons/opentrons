import { createGlobalStyle } from 'styled-components'
import { COLORS } from '@opentrons/components'
import 'typeface-open-sans'
import '@fontsource/public-sans'

export const GlobalStyle = createGlobalStyle<{ isOnDevice?: boolean }>`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: ${props =>
      props.isOnDevice ?? false ? 'Public Sans' : 'Open Sans'}, sans-serif;
  }

  html,
  body {
    width: 100%;
    height: 100%;
    color: ${COLORS.darkBlackEnabled};
  }

  a {
    text-decoration: none;
  }

  button {
    border: none;

    &:focus,
    &:active {
      outline: 0;
    }
  }
`
