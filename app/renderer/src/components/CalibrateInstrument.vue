<template>

<div class="calibration-modal mode-droptip">
	<div class="pipette-img">
<!-- 	  <img src="../assets/img/pipette_top.png" class="top" />
	  <img src="../assets/img/pipette_bottom.png" class="bottom" />
	  <img src="../assets/img/pipette_blowout.png" class="blowout" /> -->
	  <img src="../assets/img/pipette_droptip.png" class="droptip" />
	</div>
	<div class="update">
	  <span class="position top">Top</span>
	  <button class="btn-update save top" data-save-pipette="top">Save</button>
	  <button class="btn-update moveto ">Move</button>
	  <div class="spacer"></div>
	  <span class="position bottom">Bottom</span>
	  <button class="btn-update save bottom" data-save-pipette="bottom">Save</button>
	  <button class="btn-update moveto ">Move</button>
	  <span class="position blowout">Blowout</span>
	  <button class="btn-update save blowout" data-save-pipette="blowout">Save</button>
	  <button class="btn-update moveto">Move</button>
	  <span class="position droptip">Drop Tip</span>
	  <button class="btn-update save droptip" data-save-pipette="droptip">Save</button>
	  <button class="btn-update moveto disabled">Move</button>
	  <button class="btn-update test pick-liquid disabled">Pick Up</button>
	  <button class="btn-update test eject-liquid disabled">Eject</button>
	</div>
	</div>
</div>
<!-- End Calibration Modal -->
	
</template>

<script>
  export default {
    name: 'CalibrateInstrument',
    props: ['instrument'],
    data: function() {
      return {

      }
    },
    methods: {
    	calibrateInstrument(instrument){
    		let axis = instrument.axis
    		let position = instrumant.postion
    		this.$store.dispatch("calibrateInstrument", {axis: axis, position: position})
    	}			
    },
    computed: { 
    	
    }

  }
</script>