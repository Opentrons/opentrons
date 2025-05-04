import { css } from '@emotion/react'

// Import necessary fonts
import 'typeface-open-sans'
import '@fontsource/dejavu-sans'
import '@fontsource/public-sans'
import '@fontsource/public-sans/600.css'
import '@fontsource/public-sans/700.css'

// Assuming COLORS and PRODUCT are imported from your project structure
// Example placeholder imports:
// import { COLORS, PRODUCT } from './path/to/constants';

// Placeholder definitions if the actual imports are not available
const COLORS = {
  black90: '#1A1A1A', // Example color
}

const PRODUCT = {
  TYPOGRAPHY: {
    fontFamily: "'Public Sans'", // Example font family
  },
}

// Define the global styles using Emotion's css helper
export const globalStyles = css`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    /*
     * TODO(ew, 06/19/23): The main font is Public Sans but it does not have subscript glyphs,
     * needed to display chemical formulae on the liquids page. I've added DejaVu Sans, which
     * does have the glyphs, as a fallback so subscripts will get displayed. Mel and the design
     * team will want to revisit the fonts we use at some point in the future.
     */
    font-family: ${PRODUCT.TYPOGRAPHY.fontFamily}, 'DejaVu Sans', sans-serif;
  }

  html,
  body {
    width: 100%;
    height: 100%;
    color: ${COLORS.black90};
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
