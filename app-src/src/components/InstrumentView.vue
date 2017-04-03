<template>
  <div class="task">
  <div class="instrument">
    <deck-map v-if='instrument()' :instrument='instrument()' :deck='deck()' ></deck-map>

    <CalibrateInstrument :instrument='instrument()'></CalibrateInstrument>
  </div>
        <section id='instructions' v-if='this.instrument()'></section>
  </div>
</template>

<script>
  import CalibrateInstrument from './CalibrateInstrument.vue'
  import DeckMap from './DeckMap.vue'

  export default {
    name: 'Instrument',
    components: {
      CalibrateInstrument,
      DeckMap
    },
    methods: {
      params () {
        return this.$route.params
      },
      deck () {
        return this.$store.state.tasks.deck
      },
      instrument () {
        return this.$store.state.tasks.instruments.filter((instrument) => {
          return instrument.axis === this.params().instrument
        })[0]
      }
    },
    computed: {
      channels () {
        return this.instrument().channels === 1 ? 'single' : 'multi'
      }
    },
    created: function () {
      if (!this.$store.state.tasks[0]) {
        this.$store.dispatch('loadProtocol')
      }
    }
  }

</script>
