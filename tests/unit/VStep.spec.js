import { shallowMount } from '@vue/test-utils'
import VStep from '@/components/VStep.vue'
import { DEFAULT_OPTIONS, DEFAULT_STEP_OPTIONS } from '@/shared/constants'
import { customAlphabet } from 'nanoid'

describe('VStep.vue', () => {
  it('renders props.step.content', () => {
    const step = {
      target: 'v-step-0',
      content: 'This is a demo step!'
    }

    const wrapper = shallowMount(VStep, {
      propsData: {
        step,
        stepHash: customAlphabet('1234567890abcdef', 8)(),
        stepParams: DEFAULT_STEP_OPTIONS,
        stop: () => {},
        labels: DEFAULT_OPTIONS.labels
      }
    })

    expect(wrapper.element).toMatchSnapshot()

    expect(wrapper.text()).toContain(step.content)
  })
})
