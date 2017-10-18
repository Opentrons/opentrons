# Protocol Designer Prototype

## Use with `npm`

```bash
npm install # Installing dependencies.
npm run build # Building the application.
npm start # Starts the app on http://localhost:8080/
```

# Ingredient state shape

```javascript
[
  {
    name: 'Blood Samples',
    locations: {
      // [slotName]: [wellName, wellName, etc] for all slots.
      A1: ['C2', 'C3', 'C4'],
    },
    wellDetails: { // also referenced wellDetails[slotName][wellName]
      A1: {
        C2: { volume: 100, concentration: 10, name: 'Special Sample' }
        /* ^^ could have description too, but doesn't need to have any keys. */
      }
    },

    volume: 20, // required. in uL
    concentration: null, // optional number, a %
    description: 'blah', // optional string

    individualize: true // when false, ignore wellDetails
    // (we should probably delete wellDetails if individualize is set false -> true)
  },
  {
    name: 'Control',
    locations: {
      'A1': ['A1']
    },
    wellDetails: null,
    volume: 50,
    concentration: null,
    description: '',
    individualize: false
  },
  {
    name: 'Buffer',
    locations: {
      'A1': ['H1', 'H2', 'H3', 'H4']
    },
    wellDetails: null,
    volume: 100,
    concentration: 50,
    description: '',
    individualize: false
  }
]
```

Colors are assigned by position in the outermost array, as is the order top to bottom of how ingredient cards show up

`wellDetails` allows any individual well to use its own settings for volume, concentration, and maybe description -- only used when `individualize === true`. Otherwise, wells inherit the default settings from their ingredient category.

  * If a 'settings' key (volume/description/concentration) is not present in the `wellDetails` (or has value `undefined`), then the well will inherit the value of that setting from its category defaults. But it CAN have a falsey value: `''` or `0` will override defaults.

(I'm on the fence about whether `individualize` should really just be `!!wellDetails`... but it might as well be more explicit for now. This gives us the ability to store well details, toggle them off, then toggle back on.)
