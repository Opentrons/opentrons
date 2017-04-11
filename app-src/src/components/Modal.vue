<template>
  <transition name="modal">
    <div class="modal-mask" @click="$emit('close')">
      <div class="modal-wrapper">
        <div class="modal-container">
          <div class='well-img'>
            <button class="modal-close-button" @click="$emit('close')">
                X
            </button>
            <img :src='`${placeableImages(placeable.sanitizedType, channels)}`' />
            <p>
        Calibrate the {{instrument.label}} pipette to the
        {{placeable.sanitizedType === 'tiprack' ? 'center' : 'bottom'}}
        {{calibrationPoint}} of your {{placeable.label}} container.
      </h1></p>
          </div>       
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
