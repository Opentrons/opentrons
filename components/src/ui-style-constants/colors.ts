// colors fundamentals
export const white = '#ffffff'
export const fundamentalsBackground = '#f8f8f8'
export const lightBlue = '#f1f8ff'
export const medBlue = '#d9e9fe'
export const fundamentalsFocus = '#f09d20'
export const black = '#000000'
export const fundamentalsBackgroundShade = '#eeeeee'
// note 07/27/2022 kj keep this color to avoid break H/S design
// this will be fixed in the future
export const darkGrey = '#4a4a4a'

// opacity hex codes to append to 6-digit color hex codes
// taken from table: https://davidwalsh.name/hex-opacity
export const opacity0HexCode = '00' // 0% opacity
export const opacity10HexCode = '1a' // 10% opacity
export const opacity12HexCode = '1f' // 12% opacity
export const opacity15HexCode = '26' // 15% opacity
export const opacity17HexCode = '2b' // 17% opacity
export const opacity20HexCode = '33' // 20% opacity
export const opacity30HexCode = '4d' // 30% opacity
export const opacity35HexCode = '59' // 35% opacity
export const opacity40HexCode = '66' // 40% opacity
export const opacity50HexCode = '80' // 50% opacity
export const opacity55HexCode = '8c' // 55% opacity
export const opacity60HexCode = '99' // 60% opacity
export const opacity70HexCode = 'b3' // 70% opacity
export const opacity90HexCode = 'e6' // 90% opacity

// colors blue
export const blueEnabled = '#006cfa'
export const blueHover = '#0061e0'
export const bluePressed = '#0050b8'
export const medBluePressed = '#9cb9e0'

// colors black
export const darkBlackEnabled = '#16212d'
export const darkBlackHover = '#24313f'
export const darkBlackSelected = '#39495b'
export const darkBlackLight = '#283d52'

// colors yellow
export const dandelionYellowEnabled = '#f2b53c'
export const dandelionYellowHover = '#eca20f'
export const dandelionYellowPressed = '#eca20f'

// colors grey
export const lightGreyPressed = `${darkBlackEnabled}${opacity17HexCode}`
export const lightGreyHover = `${darkBlackEnabled}${opacity10HexCode}`
export const medGreyEnabled = '#e3e3e3'
export const medGreyHover = '#b8b8b8'
export const medGreyPressed = '#5a5a5e'
export const medGreySelected = '#5a5a5e'
export const darkGreyEnabled = '#707075'
export const darkGreyHover = '#646468'
export const darkGreyPressed = '#5a5a5e'
export const darkGreySelected = '#5a5a5e'
export const darkGreyDisabled = '#eaeaeb'

// colors success
export const successBackgroundLight = '#f3fffa'
export const successBackgroundMed = '#def4eb'
export const successEnabled = '#04aa65'
export const successText = '#00854d'
export const successDisabled = '#8f8f8f'

// colors warning
export const warningBackgroundLight = '#fffcf5'
export const warningBackgroundMed = '#fcf0d8'
export const warningEnabled = '#f09d20'
export const warningText = '#7b5b09'
export const warningDisabled = '#8f8f8f'

// colors error
export const errorBackgroundLight = '#fff3f3'
export const errorBackgroundMed = '#f7e0e0'
export const errorEnabled = '#bf0000'
export const errorHover = '#a30000'
export const errorText = '#850000'
export const errorDisabled = '#8f8f8f'

// others
export const transparent = 'transparent'
export const backgroundOverlay = `${darkBlackEnabled}${opacity35HexCode}`

// colors pd liquid
export const electricPurple = '#b925ff'
export const goldenYellow = '#ffd600'
export const aquamarine = '#9dffd8'
export const orangePeel = '#ff9900'
export const skyBlue = '#50d5ff'
export const popPink = '#ff80f5'
export const springGreen = '#7eff42'
export const tartRed = '#ff4f4f'
export const whaleGrey = '#9395a0'

export const liquidColors = [
  electricPurple,
  goldenYellow,
  aquamarine,
  orangePeel,
  skyBlue,
  popPink,
  springGreen,
  tartRed,
  whaleGrey,
]

// touchscreen light mode colors
export const darkBlack_hundred = darkBlackEnabled
export const darkBlack_ninety = `${darkBlackEnabled}${opacity90HexCode}`
export const darkBlack_seventy = `${darkBlackEnabled}${opacity70HexCode}`
export const darkBlack_sixty = `${darkBlackEnabled}${opacity60HexCode}`
export const darkBlack_forty = `${darkBlackEnabled}${opacity40HexCode}`
export const darkBlack_twenty = `${darkBlackEnabled}${opacity20HexCode}`

export const light_one = '#d0d0d0'
export const light_one_pressed = '#b4b6b8'
export const light_two = '#e0e0e0'

export const highlightPurple_one = '#9c3ba4'
export const highlightPurple_one_pressed = '#883792'
export const highlightPurple_two = '#e7c3e9'
export const highlightPurple_two_pressed = '#c8abcd'

// touchscreen foundational color
export const foundationalBlue = '#b4d4ff'

// touchscreen communication colors
export const green_one = '#027e23'
export const green_two = '#2ebd55'
export const green_three = '#a1ffbc'
export const green_three_pressed = '#8cdea7'
export const green_four = '#baffcd'

export const yellow_one = '#7a5200'
export const yellow_two = '#ec930f'
export const yellow_three = '#ffe1a4'
export const yellow_three_pressed = '#dcc492'
export const yellow_four = '#ffe9be'

export const red_one = errorText
export const red_two = '#e31e1e'
export const red_two_pressed = '#c41e20'
export const red_three = '#fbcdcd'
export const red_three_pressed = '#d9b3b5'
// export const red_four = errorText
