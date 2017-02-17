<template>
  <section id='task' v-if='this.instrument() && this.placeable()'>
    <h1 class='title'>
      Calibrate the {{this.instrument().label}} pipette to the
      {{this.placeable().sanitizedType === 'tiprack' ? 'center' : 'bottom'}}
      {{this.calibrationPoint}} of your {{this.placeable.label}} container
    </h1>
    <CalibratePlaceable :placeable='placeable()' :instrument='instrument()'>
    </CalibratePlaceable>
    <div class='well-img'>
      <img :src='`${placeableImages(this.placeable().sanitizedType, this.channels)}`' />
    </div>
  </section>
</template>

<script>
  import CalibratePlaceable from './CalibratePlaceable.vue'

  export default {
    name: 'Placeable',
    components: {
      CalibratePlaceable
    },
    methods: {
      params () {
        return this.$route.params
      },
      instrument () {
        return this.$store.state.tasks.filter((instrument) => {
          return instrument.axis === this.params().instrument
        })[0]
      },
      placeable () {
        let placeable = this.instrument().placeables.filter((p) => {
          return p.label === this.params().placeable
        })[0]
        let sanitized = ['point', 'tiprack', 'trough', 'tuberack'].filter((el) =>
          placeable.type.includes(el)
        )[0]

        placeable.sanitizedType = sanitized || 'default'
        return placeable
      },
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
    computed: {
      channels () {
        return this.instrument().channels === 1 ? 'single' : 'multi'
      },
      calibrationPoint () {
        let type = this.placeable().sanitizedType
        let position = 'of the A1 well'
        if (type === 'trough') {
          position = 'of the A1 slot'
        } else if ((type === 'tiprack' || type === 'default') && this.instrument().channels === 8) {
          position = 'of the A1 row'
        } else if (type === 'point') {
          position = ''
        }
        return position
      }
    },
    created: function () {
      if (!this.$store.state.tasks[0]) {
        this.$store.dispatch('loadProtocol')
      }
    }
  }
</script>
