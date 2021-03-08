import { mount } from '@vue/test-utils'
import Vue from 'vue'
import VueTour from '@/main'
import VTour from '@/components/VTour.vue'
import { JSDOM } from 'jsdom'
import nanoid, { customAlphabet } from 'nanoid'

const dom = new JSDOM()
global.document = dom.window.document
global.window = dom.window

Vue.use(VueTour)

const steps = [
  {
    target: '#v-step-0',
    content: `Discover <strong>Vue Tour</strong>!`
  },
  {
    target: '#v-step-1',
    content: 'An awesome plugin made with Vue.js!'
  }
]

beforeAll(() => {
  // Mock the scrollIntoView function
  Element.prototype.scrollIntoView = jest.fn()

  // Add div elements mocking the steps
  const docFrag = document.createDocumentFragment()

  steps.forEach(step => {
    const div = document.createElement('div')
    div.setAttribute('id', step.target)
    docFrag.appendChild(div)
  })

  document.body.appendChild(docFrag)
})

describe('VTour.vue', () => {
  it('has the correct number of steps', () => {
    const wrapper = mount(VTour, {
      propsData: {
        name: 'myTestTour',
        steps
      }
    })

    expect(wrapper.vm.steps.length).toEqual(2)

    expect(wrapper.element).toMatchSnapshot()
  })

  it('registers itself in the global Vue instance', () => {
    const wrapper = mount(VTour, {
      propsData: {
        name: 'myTestTour',
        steps: []
      }
    })

    expect(typeof wrapper.vm.$tours).toBe('object')
    expect(wrapper.vm.$tours).toHaveProperty('myTestTour')

    expect(wrapper).toMatchSnapshot()
  })

  it('stays within the boundaries of the number of steps', async () => {
    const wrapper = mount(VTour, {
      propsData: {
        name: 'myTestTour',
        steps
      }
    })

    expect(wrapper.vm.currentStep).toEqual(-1)

    expect(wrapper).toMatchSnapshot()

    await wrapper.vm.start()
    expect(wrapper.vm.currentStep).toEqual(0)

    expect(wrapper).toMatchSnapshot()

    // We call nextStep one more time than needed
    for (let i = 0; i < steps.length; i++) {
      await wrapper.vm.nextStep()
    }

    expect(wrapper.vm.currentStep).toEqual(1)

    expect(wrapper).toMatchSnapshot()

    // We call previousStep one more time than needed
    for (let i = 0; i < steps.length; i++) {
      await wrapper.vm.previousStep()
    }

    expect(wrapper.vm.currentStep).toEqual(0)

    wrapper.vm.stop()

    expect(wrapper.vm.currentStep).toEqual(-1)

    expect(wrapper).toMatchSnapshot()
  })

  describe('#before', () => {
    let step0 = false
    let step1 = false
    const beforeSteps = [
      {
        target: '#v-step-0',
        content: `Discover <strong>Vue Tour</strong>!`,
        before: () => {
          step0 = true
          return Promise.resolve()
        }
      },
      {
        target: '#v-step-1',
        content: 'An awesome plugin made with Vue.js!',
        before: () => {
          step1 = true
          return Promise.resolve()
        }
      },
      {
        target: '#v-step-2',
        content: 'An awesome plugin made with Vue.js!',
        before: () => {
          return Promise.reject(new Error('testing'))
        }
      },
      {
        target: '#v-step-3',
        content: 'An awesome plugin made with Vue.js!',
        before: () => {
          return Promise.resolve()
        }
      }
    ]

    it('invokes before() on start()', async () => {
      const wrapper = mount(VTour, {
        propsData: {
          name: 'myTestTour',
          steps: beforeSteps
        }
      })

      await wrapper.vm.start()
      expect(wrapper.vm.currentStep).toEqual(0)
      expect(step0).toEqual(true)

      jest.mock('nanoid', () => {
        return {
          customAlphabet: jest.fn(() => 1)()
        }
      })

      // nanoid.customAlphabet('1234567890abcdef').mockImplementation(() => 1)

      // jest.mock('nanoid', () => ({ customAlphabet: () => jest.fn()() }))
      // test2 = jest.fn(() => 1)()

      jest.mock(
        'nanoid',
        () => {
          const _customAlphabet = jest.fn().mockReturnValue('1234abcd')
          return {
            customAlphabet: jest.fn(() => _customAlphabet)
          }
        },
        { virtual: true }
      )

      expect(wrapper.element).toMatchSnapshot()

      step0 = false
      step1 = false
    })

    it('invokes before() on nextStep()', async () => {
      const wrapper = mount(VTour, {
        propsData: {
          name: 'myTestTour',
          steps: beforeSteps
        }
      })

      await wrapper.vm.start()
      expect(wrapper.vm.currentStep).toEqual(0)

      await wrapper.vm.nextStep()
      expect(wrapper.vm.currentStep).toEqual(1)
      expect(step1).toEqual(true)

      step0 = false
      step1 = false
    })

    it('handles before() promise rejection on start', async () => {
      const wrapper = mount(VTour, {
        propsData: {
          name: 'myTestTour',
          steps: beforeSteps
        }
      })

      try {
        await wrapper.vm.start(2)
        expect(true).toEqual(false) // dead code
      } catch (e) {
        expect(e.message).toEqual('testing')
        expect(wrapper.vm.currentStep).toEqual(-1)
      }
    })

    it('handles before() promise rejection on nextStep()', async () => {
      const wrapper = mount(VTour, {
        propsData: {
          name: 'myTestTour',
          steps: beforeSteps
        }
      })

      await wrapper.vm.start(1)

      try {
        await wrapper.vm.nextStep()
        expect(true).toEqual(false) // dead code
      } catch (e) {
        expect(e.message).toEqual('testing')
        expect(wrapper.vm.currentStep).toEqual(1)
      }
    })

    it('handles before() promise rejection on previousStep()', async () => {
      const wrapper = mount(VTour, {
        propsData: {
          name: 'myTestTour',
          steps: beforeSteps
        }
      })

      await wrapper.vm.start(3)

      try {
        await wrapper.vm.previousStep()
        expect(true).toEqual(false) // dead code
      } catch (e) {
        expect(e.message).toEqual('testing')
        expect(wrapper.vm.currentStep).toEqual(3)
      }
    })
  })
})
