<!--
  Copyright for portions of vuetour are held by Lionel T., 2021 as part of project reactour.
  All other copyright for vuetour are held by Timur Girgin, 2021.
-->

<template>
  <svg
    :width="windowWidth"
    :height="windowHeight"
    xmlns="http://www.w3.org/2000/svg"
    class="v-tour__mask"
  >
    <defs>
      <mask id="mask-main">
        <rect
          x="0"
          y="0"
          :width="windowWidth"
          :height="windowHeight"
          fill="white"
        />
        <rect :x="left" :y="top" :width="width" :height="height" fill="black" />
        <!-- top left rounded corner -->
        <rect
          :x="left - 1"
          :y="top - 1"
          :width="rounded"
          :height="rounded"
          fill="white"
        />
        <circle
          :cx="left + rounded"
          :cy="top + rounded"
          :r="rounded"
          fill="black"
        />
        <!-- top right rounded corner -->
        <rect
          :x="left + width - rounded + 1"
          :y="top - 1"
          :width="rounded"
          :height="rounded"
          fill="white"
        />
        <circle
          :cx="left + width - rounded"
          :cy="top + rounded"
          :r="rounded"
          fill="black"
        />
        <!-- bottom left rounded corner -->
        <rect
          :x="left - 1"
          :y="top + height - rounded + 1"
          :width="rounded"
          :height="rounded"
          fill="white"
        />
        <circle
          :cx="left + rounded"
          :cy="top + height - rounded"
          :r="rounded"
          fill="black"
        />
        <!-- bottom right rounded corner -->
        <rect
          :x="left + width - rounded + 1"
          :y="top + height - rounded + 1"
          :width="rounded"
          :height="rounded"
          fill="white"
        />
        <circle
          :cx="left + width - rounded"
          :cy="top + height - rounded"
          :r="rounded"
          fill="black"
        />
      </mask>
      <clipPath id="clip-path">
        <!-- top -->
        <rect x="0" y="0" :width="windowWidth" :height="top" />
        <!-- left -->
        <rect x="0" :y="top" :width="left" :height="height" />
        <!-- right -->
        <rect
          :x="targetLeft + targetWidth + padding"
          :y="top"
          :width="clipWidth"
          :height="height"
        />
        <!-- bottom-->
        <rect
          x="0"
          :y="targetTop + targetHeight + padding"
          :width="windowWidth"
          :height="clipHeight"
        />
      </clipPath>
    </defs>
    <rect
      :x="0"
      :y="0"
      :width="windowWidth"
      :height="windowHeight"
      fill="currentColor"
      mask="url(#mask-main)"
    />
    <rect
      x="0"
      y="0"
      :width="windowWidth"
      :height="windowHeight"
      fill="currentColor"
      clip-path="url(#clip-path)"
    />
    <rect
      :x="left"
      :y="top"
      :width="width"
      :height="height"
      fill="transparent"
      class="disableInteractionClassName"
    />
  </svg>
</template>

<script>
export default {
  name: 'v-mask',
  props: {
    targetWidth: {
      type: Number,
      required: true
    },
    targetHeight: {
      type: Number,
      required: true
    },
    targetLeft: {
      type: Number,
      required: true
    },
    targetTop: {
      type: Number,
      required: true
    },
    windowWidth: {
      type: Number,
      required: true
    },
    windowHeight: {
      type: Number,
      required: true
    },
    padding: {
      type: Number,
      default: 0
    },
    rounded: {
      type: Number,
      default: 0
    }
  },
  computed: {
    width () {
      const width = (this.targetWidth + this.padding) * 2
      return width < 0 ? 0 : width
    },
    height () {
      const height = (this.targetHeight + this.padding) * 2
      return height < 0 ? 0 : height
    },
    top () {
      const top = this.targetTop - this.padding
      return top < 0 ? 0 : top
    },
    left () {
      const left = this.targetLeft - this.padding
      return left < 0 ? 0 : left
    },
    clipHeight () {
      const height = (this.windowHeight - this.targetHeight - this.top)
      return height < 0 ? 0 : height
    },
    clipWidth () {
      const width = (this.windowWidth - this.targetWidth - this.left)
      return width < 0 ? 0 : width
    }
  }
}
</script>

<style scoped lang="scss">
.v-tour__mask {
  position: absolute;
  opacity: 0.65;
  z-index: 200;
}
</style>
