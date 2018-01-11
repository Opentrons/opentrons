All available icons:

```js
// import {ALERT, BACK, REFRESH, etc.} from @opentrons/components
const {
  ALERT, BACK, CLOSE, REFRESH, SPINNER, USB, WIFI, FLASK, CHECKED, UNCHECKED, CHEVRON_UP,
  CHEVRON_DOWN, CHEVRON_LEFT, CHEVRON_RIGHT, FILE, COG, CONNECT, CONDENSE, DISTRIBUTE,
  MIX, PAUSE, ARROW_RIGHT
} = require('./icon-data')

;<div>
  <Icon width='64px' name={ALERT} />
  <Icon width='64px' name={BACK} />
  <Icon width='64px' name={CLOSE} />
  <Icon width='64px' name={REFRESH} />
  <Icon width='64px' name={SPINNER} />
  <Icon width='64px' name={USB} />
  <Icon width='64px' name={WIFI} />
  <Icon width='64px' name={FLASK} />
  <Icon width='64px' name={CHECKED} />
  <Icon width='64px' name={UNCHECKED} />
  <Icon width='64px' name={CHEVRON_UP} />
  <Icon width='64px' name={CHEVRON_DOWN} />
  <Icon width='64px' name={CHEVRON_LEFT} />
  <Icon width='64px' name={CHEVRON_RIGHT} />
  <Icon width='64px' name={FILE} />
  <Icon width='64px' name={COG} />
  <Icon width='64px' name={CONNECT} />
  <Icon width='64px' name={CONDENSE} />
  <Icon width='64px' name={DISTRIBUTE} />
  <Icon width='64px' name={MIX} />
  <Icon width='64px' name={PAUSE} />
  <Icon width='64px' name={ARROW_RIGHT} />
</div>
```

Spin any icon!

```js
// import {REFRESH, SPINNER} from @opentrons/components
const {REFRESH, SPINNER} = require('./icon-data')

;<div>
  <Icon width='64px' name={SPINNER} spin />
  <Icon width='64px' name={REFRESH} spin />
</div>
```
