<template>
  <div class="v-tour">
    <v-mask
      v-if="backgroundMask"
      :windowHeight="this.mask.windowHeight"
      :windowWidth="this.mask.windowWidth"
      :targetWidth="this.mask.targetWidth"
      :targetHeight="this.mask.targetHeight"
      :targetLeft="this.mask.targetLeft"
      :targetTop="this.mask.targetTop"
    ></v-mask>
    <v-step
      :id="'v-step-' + stepHash"
      :ref="'v-step-' + stepHash"
      v-if="steps[currentStep]"
      :stepHash="stepHash"
      :stepParams="stepParams"
      :step="steps[currentStep]"
      :key="currentStep"
      :previous-step="previousStep"
      :next-step="nextStep"
      :stop="stop"
      :skip="skip"
      :finish="finish"
      :is-first="isFirst"
      :is-last="isLast"
      :labels="customOptions.labels"
      :enabled-buttons="customOptions.enabledButtons"
      :highlight="customOptions.highlight"
      :stop-on-fail="customOptions.stopOnTargetNotFound"
      :debug="customOptions.debug"
      :targetElement="targetElement"
      @targetNotFound="$emit('targetNotFound', $event)"
      @show-mask="showMask"
    >
    </v-step>
  </div>
</template>

<script>
import { DEFAULT_CALLBACKS, DEFAULT_OPTIONS, DEFAULT_STEP_OPTIONS, KEYS } from '@/shared/constants'
import VMask from '@/components/VMask'
import { customAlphabet } from 'nanoid'

export default {
  name: 'v-tour',
  components: { VMask },
  props: {
    steps: {
      type: Array,
      default: () => []
    },
    name: {
      type: String
    },
    options: {
      type: Object,
      default: () => { return DEFAULT_OPTIONS }
    },
    callbacks: {
      type: Object,
      default: () => { return DEFAULT_CALLBACKS }
    }
  },
  data () {
    return {
      currentStep: -1,
      backgroundMask: false,
      mask: {
        windowHeight: 0,
        windowWidth: 0,
        targetHeight: 0,
        targetWidth: 0,
        targetTop: 0,
        targetLeft: 0
      },
      targetElement: null,
      stepHash: null
    }
  },
  mounted () {
    this.$tours[this.name] = this
    if (this.customOptions.useKeyboardNavigation) {
      window.addEventListener('keyup', this.handleKeyup)
    }

    this.mask.windowWidth = window.innerWidth
    this.mask.windowHeight = document.body.scrollHeight

    window.addEventListener('resize', this.handleWindowResize)
  },
  beforeDestroy () {
    // Remove the keyup listener if it has been defined
    if (this.customOptions.useKeyboardNavigation) {
      window.removeEventListener('keyup', this.handleKeyup)
    }

    window.removeEventListener('resize', this.handleWindowResize)
  },
  computed: {
    // Allow us to define custom options and merge them with the default options.
    // Since options is a computed property, it is reactive and can be updated during runtime.
    customOptions () {
      return {
        ...DEFAULT_OPTIONS,
        ...this.options
      }
    },
    stepParams () {
      return {
        ...DEFAULT_STEP_OPTIONS,
        ...{ highlight: this.highlight }, // Use global tour highlight setting first
        ...{ enabledButtons: Object.assign({}, this.enabledButtons) },
        ...this.step.params // Then use local step parameters if defined
      }
    },
    customCallbacks () {
      return {
        ...DEFAULT_CALLBACKS,
        ...this.callbacks
      }
    },
    // Return true if the tour is active, which means that there's a VStep displayed
    isRunning () {
      return this.currentStep > -1 && this.currentStep < this.numberOfSteps
    },
    isFirst () {
      return this.currentStep === 0
    },
    isLast () {
      return this.currentStep === this.steps.length - 1
    },
    numberOfSteps () {
      return this.steps.length
    },
    step () {
      return this.steps[this.currentStep]
    }
  },
  methods: {
    async start (startStep) {
      // Wait for the DOM to be loaded, then start the tour
      startStep = typeof startStep !== 'undefined' ? parseInt(startStep, 10) : 0
      let step = this.steps[startStep]

      let process = () => new Promise((resolve) => {
        setTimeout(() => {
          this.customCallbacks.onStart()
          this.currentStep = startStep
          resolve()
        }, this.customOptions.startTimeout)
      })

      if (typeof step.before !== 'undefined') {
        try {
          await step.before('start')
        } catch (e) {
          return Promise.reject(e)
        }
      }
      await process()

      return Promise.resolve()
    },
    async previousStep () {
      let futureStep = this.currentStep - 1

      let process = () => new Promise((resolve) => {
        this.customCallbacks.onPreviousStep(this.currentStep)
        this.currentStep = futureStep
        resolve()
      })

      if (futureStep > -1) {
        let step = this.steps[futureStep]
        if (typeof step.before !== 'undefined') {
          try {
            await step.before('previous')
          } catch (e) {
            return Promise.reject(e)
          }
        }
        await process()
      }

      return Promise.resolve()
    },
    async nextStep () {
      let futureStep = this.currentStep + 1

      let process = () => new Promise((resolve) => {
        this.customCallbacks.onNextStep(this.currentStep)
        this.currentStep = futureStep
        resolve()
      })

      if (futureStep < this.numberOfSteps && this.currentStep !== -1) {
        let step = this.steps[futureStep]
        if (typeof step.before !== 'undefined') {
          try {
            await step.before('next')
          } catch (e) {
            return Promise.reject(e)
          }
        }
        await process()
      }

      return Promise.resolve()
    },
    stop () {
      this.showMask(false)
      this.customCallbacks.onStop()
      document.body.classList.remove('v-tour--active')
      this.currentStep = -1
    },
    skip () {
      this.customCallbacks.onSkip()
      this.stop()
    },
    finish () {
      this.customCallbacks.onFinish()
      this.stop()
    },
    handleKeyup (e) {
      if (this.customOptions.debug) {
        console.log('[Vue Tour] A keyup event occurred: ', e)
      }
      switch (e.keyCode) {
        case KEYS.ARROW_RIGHT:
          this.isKeyEnabled('ARROW_RIGHT') && this.nextStep()
          break
        case KEYS.ARROW_LEFT:
          this.isKeyEnabled('ARROW_LEFT') && this.previousStep()
          break
        case KEYS.ESCAPE:
          this.isKeyEnabled('ESCAPE') && this.stop()
          break
      }
    },
    isKeyEnabled (key) {
      const { enabledNavigationKeys } = this.customOptions
      return enabledNavigationKeys.hasOwnProperty(key) ? enabledNavigationKeys[key] : true
    },
    handleWindowResize () {
      this.mask.windowWidth = window.innerWidth
    },
    showMask (show) {
      document.documentElement.style.overflow = show ? 'hidden' : 'none'
      this.backgroundMask = show
    }
  },
  watch: {
    step () {
      this.stepHash = customAlphabet('1234567890abcdef', 8)()
      this.targetElement = document.querySelector(this.step?.target)
      // If we have a target element we create a mask around it
      if (this.targetElement) {
        const { left, top, height, width } = this.targetElement?.getBoundingClientRect()
        this.mask = Object.assign({}, this.mask, {
          targetHeight: height,
          targetWidth: width,
          targetLeft: left,
          targetTop: top
        })
        this.showMask(this.stepParams.mask)
      } else if (this.step?.params?.mask) {
        this.mask = Object.assign({}, this.mask, {
          targetHeight: 0,
          targetWidth: 0,
          targetLeft: 0,
          targetTop: 0
        })
        this.showMask(this.stepParams.mask)
      }
    }
  }
}
</script>

<style lang="scss">
  body.v-tour--active {
    pointer-events: none;
  }

  .v-tour {
    pointer-events: auto;

    &__target {
      &--highlighted {
        box-shadow: 0 0 0 4px rgba(0,0,0,.4);
        pointer-events: auto;
        z-index: 9999;
      }
      &--relative {
        position: relative;
      }
    }
  }
</style>
