<template>

    <section id="volume-view">
      <div class="add-tip" v-if="currentStep == 'add-tip'">
        <h2>Push on a tip</h2>
        <button class="btn-vol" @click="currentStep = 'source'">OK</button>
      </div>

  
    <!-- TODO: get current location if checked, pass to set source method -->
      <div class="source" v-if="currentStep == 'source'">
        <h2>Select source Container/Well</h2>
        <br>
        <input type="checkbox" v-model="useCurrentSource"><label>Use Current Location</label>
        <h3>or</h3>
        <select v-model='sourceContainer'>
          <option value='Select Source Container'>Select Source Container</option>
          <option v-for='container in deck'> {{ container.label }}</option>
        </select>
        <label>Enter Well Location</label>
        <input type="text" v-model="sourceWell" value="">
        <button class="btn-vol" @click="currentStep = 'destination'">Aspirate</button>
      </div>

      <!-- TODO: get current location if checked, pass to set destination method -->
      <div class="destination" v-if="currentStep == 'destination'">
        <h2>Select destination Container/Well</h2>
        <br>
        <input type="checkbox" v-model="useCurrentDestination"><label>Use Current Location</label>
        <h3>or</h3>
        <select v-model='destinationContainer'>
          <option value='Select Destination Container'>Select Destination Container</option>
          <option v-for='container in deck'> {{ container.label }}</option>
        </select>
        <label>Enter Well Location</label>
        <input type="text" v-model="destinationWell" value="">
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
        volume: 0,
        sourceContainer: 'Select Source Container',
        sourceWell: '',
        destinationContainer: 'Select Destination Container',
        destinationWell: '',
        useCurrentSource: 'false',
        useCurrentDestination: 'false'
      }
    },
    computed: {
      instrument () {
        return this.$store.state.tasks.instruments.filter((instrument) => {
          return instrument.axis === this.$route.params.instrument
        })[0]
      },
      deck () {
        return this.$store.state.tasks.deck
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