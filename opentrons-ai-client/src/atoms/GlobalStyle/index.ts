import { createGlobalStyle } from 'styled-components'
import { COLORS } from '@opentrons/components'
import '@fontsource/public-sans'
import '@fontsource/public-sans/600.css'
import '@fontsource/public-sans/700.css'

export const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    font-family: 'Public Sans', 'sans-serif';
  }

  html,
  body {
    width: 100%;
    height: 100%;
    color: ${COLORS.black90};
    overflow: hidden;
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
