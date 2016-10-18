<template>

<div class="move">
  <h3 class="title">Jog X-Y-Z</h3>
  <div class="jog">
    <a href="#" data-axis="y" data-direction="neg" class="btn-full btn-y">Y</a>
    <a href="#" data-axis="z" data-direction="neg" class="btn-full btn-z">Z</a>
    <a href="#" data-axis="x" data-direction="neg" class="btn-full x">X</a>
    <a href="#" data-axis="x" data-direction="pos" class="btn-full btn-x">X</a>
    <a href="#" data-axis="y" data-direction="pos" class="btn-full btn-y">Y</a>
    <a href="#" data-axis="z" data-direction="pos" class="btn-full btn-z">Z</a>
  </div>

  <h3 class="title">Select Increment [mm]</h3>

    <increment></increment>
  </div> 
</div><!-- End Move -->
  
</template>

<script>
import Increment from './Increment.vue'
export default {
  name: 'Jog',
  components: {
    Increment
  }
}
</script>