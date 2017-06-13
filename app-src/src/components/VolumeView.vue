<template>

    <section id="volume-view">
    <button class="close" @click="close()">X</button>
      <div class="add-tip" v-if="currentStep == 'add-tip'">
        <h2>Place tip on pipette</h2>
        <p>The "max_volume" of your pipette is the number of microliters (uL) between the TOP and BOTTOM positions.</p>
        <p>During this procedure, we will transfer the amount of liquid between TOP and BOTTOM, then measure the outcome.</p>
        <p>To begin, we must place a disposable tip on the pipette we are about to calibrate the volume for.</p>
        <button class="btn-vol next" @click="currentStep = 'source'">Next</button>
      </div>
  
      <div class="source" v-if="currentStep == 'source'">
        <h2>Select source Container/Well</h2>
        <br>
        <label for="currentSource">
            <input type="checkbox" value="true" name="currentSource" id="currentSource" v-model="useCurrentSource">
            <span>Use Current Location</span>
        </label>

        <h3>or</h3>
        <select v-model='sourceContainer'>
          <option value='Select Source Container'>Select Source Container</option>
          <option v-for='container in deck'> {{ container.slot + ' :: ' + container.label }}</option>
        </select>
        <label>Enter Well Location</label>
        <input type="text" v-model="sourceWell" value="">
        <button class="btn-vol next" @click="aspirate">Aspirate</button>
      </div>

      <div class="destination" v-if="currentStep == 'destination'">
        <h2>Select destination Container/Well</h2>
        <br>
        <label for="currentDestination">
            <input type="checkbox" value="true" name="currentDestination" id="currentDestination" v-model="useCurrentDestination">
            <span>Use Current Location</span>
        </label>
        <h3>or</h3>
        <select v-model='destinationContainer'>
          <option value='Select Destination Container'>Select Destination Container</option>
          <option v-for='container in deck'> {{ container.slot + ' :: ' + container.label }}</option>
        </select>
        <label>Enter Well Location</label>
        <input type="text" v-model="destinationWell" value="">
        <button class="btn-vol next" @click="dispense">Dispense</button>
      </div>


      <div class="enter-volume" v-if="currentStep == 'enter-volume'">
        <h2>Enter volume (or redo)</h2>
        <button class="btn-vol" @click="currentStep = 'source'">Redo</button>
        <input type="number" v-model="volume">
        Current: {{ instrument.max_volume }} uL
        <button class="btn-vol next" @click="maxVolume">Enter Calibration</button>
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
    mounted () {
      if (!this.$store.state.busy) {
        this.$store.dispatch('jogToSlot', {slot: 'C2'})
      }
    },
    methods: {
      maxVolume () {
        let volume = parseFloat(this.volume)
        let axis = this.instrument.axis
        this.$store.dispatch('maxVolume', { axis, volume })
        this.$router.push({ name: 'instrument', params: { instrument: this.instrument.axis, slot: null, placeable: null } })
      },
      close () {
        this.$router.push({ name: 'instrument', params: { instrument: this.instrument.axis, slot: null, placeable: null } })
      },
      aspirate () {
        let axis = this.instrument.axis
        let slot, label, well
        if (!this.useCurrentSource || this.useCurrentSource === 'false') {
          let temp = this.sourceContainer.split(' :: ')
          slot = temp[0]
          label = temp[1]
          well = this.sourceWell
        }
        this.$store.dispatch('aspirate', { axis, slot, label, well })
        this.currentStep = 'destination'
      },
      dispense () {
        let axis = this.instrument.axis
        let slot, label, well
        if (!this.useCurrentDestination || this.useCurrentDestination === 'false') {
          let temp = this.destinationContainer.split(' :: ')
          slot = temp[0]
          label = temp[1]
          well = this.destinationWell
        }
        this.$store.dispatch('dispense', { axis, slot, label, well })
        this.currentStep = 'enter-volume'
      }
    }
  }
</script>
