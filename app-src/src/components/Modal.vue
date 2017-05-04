<template>
  <transition name="modal">
    <div class="modal-mask" @click="$emit('close')">
      <div class="modal-wrapper">
        <div class="modal-container">
          
          <button class="modal-close-button" @click="$emit('close')">
              X
          </button>
         <h2>
            Calibrate the {{instrument.label}} pipette to the
            {{placeable.sanitizedType === 'tiprack' ? 'center' : 'bottom'}}
            {{calibrationPoint}} of your {{placeable.label}} container.
          </h2> 
          <h4>Name: {{ placeable.label }}</h4>
          <h4>Labware Type: {{ placeable.type }}</h4>
          <h4>Slot: {{ placeable.slot }}</h4>
          <h4>Pipette: {{ instrument.label }} {{channels}} {{instrumentPosition}} Axis</h4>
          <h4>Calibrated: {{instrument.calibrated}}</h4>
<!--           <div class='well-img'>
            <img :src='`${placeableImages(placeable.sanitizedType, channels)}`' />
          </div> -->        
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
  export default {
    name: 'Modal',
    props: ['placeable', 'instrument'],
    computed: {
      channels () {
        return this.instrument.channels === 1 ? 'single' : 'multi'
      },
      instrumentPosition () {
        return this.instrument.axis === 'a' ? 'Center' : 'Left'
      }
    },
    methods: {
      placeableImages (type, channels) {
        const imageUrls = {
          'default': {'single': 'well_single', 'multi': 'well_multi'},
          'tiprack': {'single': 'tiprack_single', 'multi': 'tiprack_multi'},
          'trough': {'single': 'trough_single', 'multi': 'trough_multi'},
          'tuberack': {'single': 'tuberack_single', 'multi': 'tuberack_single'},
          'point': {'single': 'point_trash', 'multi': 'point_trash'}
        }
        return require(`../assets/img/${imageUrls[type][channels]}.png`)
      }
    },
    calibrationPoint () {
      let type = this.placeable.sanitizedType
      let position = 'of the A1 well'
      if (type === 'trough') {
        position = 'of the A1 slot'
      } else if ((type === 'tiprack' || type === 'default') && this.instrument.channels === 8) {
        position = 'of the A1 row'
      } else if (type === 'point') {
        position = ''
      }
      return position
    }
  }
</script>
