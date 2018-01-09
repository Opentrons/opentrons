All available icons:

```js
// import {ALERT, BACK, REFRESH, etc.} from @opentrons/components
const {
  ALERT, BACK, REFRESH, SPINNER, USB, WIFI, FLASK, CHECKED, UNCHECKED, EXPAND
} = require('./icon-data')

;<div>
  <Icon width='64px' name={ALERT} />
  <Icon width='64px' name={BACK} />
  <Icon width='64px' name={REFRESH} />
  <Icon width='64px' name={SPINNER} />
  <Icon width='64px' name={USB} />
  <Icon width='64px' name={WIFI} />
  <Icon width='64px' name={FLASK} />
  <Icon width='64px' name={CHECKED} />
  <Icon width='64px' name={UNCHECKED} />
  <Icon width='64px' name={EXPAND} />
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
