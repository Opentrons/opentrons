# Protocol Designer Prototype

## Use with `npm`

```bash
npm install # Installing dependencies.
npm run build # Building the application.
npm start # Starts the app on http://localhost:8080/
```

# Internal Ingredient state shape

```javascript
{
  1: {
    name: 'Blood Samples',
    serializeName: 'Blood Samp',
      // Blood Samp 1, Blood Samp 2, etc.
      // This field can be blank or not exist, falls back to name
    locations: {
      // [containerId]: [wellName, wellName, etc] for all slots.
      'containerIdOne': ['C2', 'C3', 'C4']
    },
    wellDetailsByLocation: { // also referenced wellDetailsByLocation[containerId][wellName]
      'containerIdOne': {
        C2: { volume: 100, concentration: '1:10', name: 'Special Sample' }
        /* ^^ could have description too, but doesn't need to have any keys. */
      }
    },

    volume: 20, // required. in uL
    concentration: null, // optional string, user sets units
    description: 'blah', // optional string

    individualize: true // when false, ignore wellDetailsByLocation
    // (we should probably delete wellDetailsByLocation if individualize is set false -> true)
  },
  2: {
    name: 'Control',
    locations: {
      'containerIdOne': ['A1']
    },
    wellDetailsByLocation: null,
    volume: 50,
    concentration: null,
    description: '',
    individualize: false
  },
  3: {
    name: 'Buffer',
    locations: {
      'containerIdOne': ['H1', 'H2', 'H3', 'H4']
    },
    wellDetailsByLocation: null,
    volume: 100,
    concentration: '50 mol/ng',
    description: '',
    individualize: false
  }
}
```

Colors are assigned by position in the outermost array, as is the order top to bottom of how ingredient cards show up

`wellDetails` allows any individual well to use its own settings for volume, concentration, and maybe description -- only used when `individualize === true`. Otherwise, wells inherit the default settings from their ingredient category.

  * If a 'settings' key (volume/description/concentration) is not present in the `wellDetails` (or has value `undefined`), then the well will inherit the value of that setting from its category defaults. But it CAN have a falsey value: `''` or `0` will override defaults.

(I'm on the fence about whether `individualize` should really just be `!!wellDetails`... but it might as well be more explicit for now. This gives us the ability to store well details, toggle them off, then toggle back on.)

### `ingredientsForContainer` selector

Used by IngredientsList. An array of objects that each represent an ingredient group **in the currently selected container only**.

```javascript
[
  {
    concentration:
    description:
    groupId: '<ingredient group id>'
    individualize: false,
    name: 'Rat Samples',
    serializeName: null, // or a string like 'Sample'
    volume: 20, // in uL
    wells: ['C9', 'C8', 'E9', 'E8'] // <- Wells containing this ingred in the currently selected container. Order is arbitrary.
  }
]
```

## Containers state shape

```javascript
  {
    [uniqueContainerId]: {
      type: '96-flat',
      name: 'Samples Plate',
      slotName: 'A2'
    },
    [uniqueContainerId2]: {
      type: '384-flat',
      name: 'Destination Plate',
      slotName: 'B2'
    }
  }
```

Each unique container ID is created from timestamp + random number + container type.
