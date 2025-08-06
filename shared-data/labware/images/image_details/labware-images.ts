const exactMatchOnlyLoadNames = new Set([
  'milliplex_microtiter_plate',
  'milliplex_microtiter_plate_lid',
  'ibidi_96_square_well_plate_300ul',
  'ibidi_96_square_well_plate_300ul_lid',
  'opentrons_96_deep_well_adapter',
  'opentrons_96_filtertiprack_1000ul',
  'opentrons_96_tiprack_1000ul',
  'opentrons_universal_flat_adapter',
  'opentrons_universal_flat_adapter_type_b'
])

// 1. Import all images
const imageModules = import.meta.glob('../*.{png,jpg,jpeg}', {
  eager: true,
  import: 'default',
})

// 2. Import all definition files
const definitionModules = import.meta.glob(
  '../../definitions/2/*/*.{json,ts}',
  {
    eager: true,
    import: 'default',
  }
)

// 3. Extract unique load names
const loadNames = Array.from(
  new Set(
    Object.keys(definitionModules).map(defPath => {
      const parts = defPath.split('/')
      return parts[4]
    })
  )
)

// 4. Prepare image variables and map variable names to URLs
const imageKeyToUrl: Record<string, string> = {}

for (const imgPath in imageModules) {
  const filename = imgPath.split('/').pop() ?? ''
  const base = filename.replace(/\.(png|jpe?g)$/i, '')
  const varName = base.replace(/\./g, '_').replace(/-/g, '_')
  imageKeyToUrl[varName] = imageModules[imgPath] as string
}

// 5. Match images to load names using matching rules
const labwareImages: Record<string, string[]> = {}

const matchedImageVars = new Set<string>()

for (const loadName of loadNames) {
  const normalizedLoadName = loadName.replace(/\./g, '_').replace(/-/g, '_')
  const loadParts = normalizedLoadName.split('_')

  const matchingUrls = Object.entries(imageKeyToUrl)
    .filter(([varName]) => {
      const varParts = varName.split('_')

      if (exactMatchOnlyLoadNames.has(loadName)) {
        // Only match if the variable name exactly matches the normalized load name
        return varName === normalizedLoadName
      }

      let i = 0
      for (let j = 0; j < varParts.length; j++) {
        if (loadParts[i] === varParts[j]) {
          i++
        }
        if (i === loadParts.length) break
      }

      return i === loadParts.length || normalizedLoadName.includes(varName)
    })
    .map(([varName, url]) => {
      matchedImageVars.add(varName)
      return url
    })

  if (matchingUrls.length > 0) {
    labwareImages[loadName] = matchingUrls
  }
}

// 6. Add unmatched images using their file name as loadName
for (const [varName, url] of Object.entries(imageKeyToUrl)) {
  if (!matchedImageVars.has(varName)) {
    labwareImages[varName] = [url]
  }
}

// 7. Export mapping
export { labwareImages }
