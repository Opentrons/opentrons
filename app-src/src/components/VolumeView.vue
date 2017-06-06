<template>

    <section id="volume-view">
      <div class="add-tip" v-if="currentStep == 'add-tip'">
        <h2>Push on a tip</h2>
        <button class="btn-vol" @click="currentStep = 'source'">OK</button>
      </div>
      <div class="source" v-if="currentStep == 'source'">
        <h2>Select source Container/Well or current location</h2>
        <button class="btn-vol" @click="currentStep = 'destination'">Aspirate</button>
      </div>
      <div class="destination" v-if="currentStep == 'destination'">
        <h2>Select destination Container/Well or current location</h2>
        <button class="btn-vol" @click="currentStep = 'enter-volume'">Dispense</button>
      </div>
      <div class="enter-volume" v-if="currentStep == 'enter-volume'">
        <h2>Enter volume (or redo)</h2>
        <button class="btn-vol" @click="currentStep = 'source'">Redo</button>
        <input type="number" v-model="volume">
        {{volume}}
        <button class="btn-vol" @click="maxVolume">Enter Calibration</button>
      </div>
      
    </section>

</template>

<script>
  export default {
    name: 'VolumeView',
    data () {
      return {
        currentStep: 'add-tip',
        volume: 0
      }
    },
    computed: {
      instrument () {
        return this.$store.state.tasks.instruments.filter((instrument) => {
          return instrument.axis === this.$route.params.instrument
        })[0]
      }
    },
    methods: {
      maxVolume () {
        let volume = parseFloat(this.volume)
        let axis = this.instrument.axis
        this.$store.dispatch('maxVolume', { axis, volume })
        this.$router.push({ name: 'instrument', params: { instrument: this.instrument.axis, slot: null, placeable: null } })
      }
    }
  }
</script>