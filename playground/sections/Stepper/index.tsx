import { useState } from 'react'
import { Button, Row, Stepper, Typography, type StepItem } from '../../../src'
import { Block, Section, SIZES, cap } from '../../shared'

// each step carries its own `content` — the active one renders below the strip (horizontal) or
// inline under the step (vertical), so advancing visibly swaps the panel
const STEPS: StepItem[] = [
  {
    label: 'Account',
    description: 'Email & password',
    icon: 'Profile',
    content: (
      <Typography color="muted">
        Step 1 — create your account: email, password, and a display name.
      </Typography>
    ),
  },
  {
    label: 'Shipping',
    description: 'Where to deliver',
    icon: 'Truck',
    content: (
      <Typography color="muted">
        Step 2 — pick the delivery address and a shipping speed.
      </Typography>
    ),
  },
  {
    label: 'Payment',
    description: 'Card or PayPal',
    icon: 'Card',
    optional: 'Optional',
    content: (
      <Typography color="muted">
        Step 3 — choose how to pay: card, PayPal, or on delivery.
      </Typography>
    ),
  },
  {
    label: 'Review',
    description: 'Confirm & place',
    icon: 'TickCircle',
    content: (
      <Typography color="muted">Step 4 — check everything over and place the order.</Typography>
    ),
  },
]

// plain numbered steps (no icons) — for the state / size / color demos
const BASIC: StepItem[] = [
  { label: 'Account' },
  { label: 'Shipping' },
  { label: 'Payment' },
  { label: 'Review' },
]

// a failed section: step 0 completed, step 1 error, step 2 active, step 3 upcoming — all four states
const ERROR_STEPS: StepItem[] = [
  { label: 'Account', description: 'Email & password', icon: 'Profile' },
  { label: 'Shipping', description: 'Address is incomplete', icon: 'Truck', error: true },
  { label: 'Payment', description: 'Card or PayPal', icon: 'Card' },
  { label: 'Review', description: 'Confirm & place', icon: 'TickCircle' },
]

// per-step overrides: a force-completed step + a disabled (unclickable) one
const STATE_STEPS: StepItem[] = [
  { label: 'Saved', description: 'completed: true', completed: true },
  { label: 'Current' },
  { label: 'Locked', description: 'disabled', disabled: true },
  { label: 'Review' },
]

// enough steps to overflow a normal container → the strip scrolls sideways
const MANY: StepItem[] = Array.from({ length: 10 }, (_, i) => ({
  label: `Step ${i + 1}`,
  description: i % 2 === 0 ? 'With details' : undefined,
}))

export function StepperSection() {
  const [step, setStep] = useState(0)
  const [vStep, setVStep] = useState(1)
  const [sStep, setSStep] = useState(1)
  const [mStep, setMStep] = useState(2)

  return (
    <Section>
      {/* horizontal (default) — labels under the circles, content panel below, Back/Next drive it */}
      <Block
        label="Horizontal (default)"
        description="Labels sit centered under the circles and the active step's content renders below the strip — Back / Next drive activeStep. URL sync is opt-in: this one passes the bare queryKey, so the step mirrors to ?step=N (the name from config keys.stepQueryKey). When the steps don't fit, the strip scrolls sideways (narrow the window to see it) — so it fits a phone as-is."
      >
        <Stepper
          steps={STEPS}
          activeStep={step}
          onStepChange={setStep}
          queryKey
          aria-label="Checkout"
        />
        <Row gap="xs" style={{ marginTop: 'var(--tz-space-md)' }}>
          <Button
            variant="outlined"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          <Button
            disabled={step === STEPS.length - 1}
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          >
            Next
          </Button>
        </Row>
      </Block>

      {/* vertical — rail connector, content inline under the active step, clickable heads */}
      <Block
        label="Vertical"
        // description="orientation='vertical' — steps stack along a rail and the active step's content renders inline under its label. onStepClick makes the heads clickable (click a step to jump). Its own queryKey ('vstep') so it doesn't collide with the strip above."
      >
        <Stepper
          orientation="vertical"
          steps={STEPS}
          activeStep={vStep}
          onStepClick={setVStep}
          // queryKey="vstep"
          aria-label="Vertical checkout"
        />
      </Block>

      {/* clickable + uncontrolled — the stepper owns its state and restores from the URL on refresh */}
      <Block
        label="Clickable (uncontrolled + URL restore)"
        description="No activeStep — the stepper owns its state (defaultStep) and selects on click itself. It syncs to its own queryKey ('cstep'), so pick a step and refresh the page: the step is restored from the URL."
      >
        <Stepper
          steps={BASIC}
          defaultStep={1}
          // queryKey="cstep"
          onStepClick={(i) => console.log('Clicked step', i)}
          aria-label="Clickable steps"
        />
      </Block>

      {/* error state — completed + error + active + upcoming at once */}
      <Block
        label="Error state"
        description="A step with error shows a red indicator + label (e.g. its form section failed validation) — here step 1 is completed, step 2 errored, step 3 is active, step 4 upcoming. Shown in both orientations."
      >
        <Stepper steps={ERROR_STEPS} activeStep={2} aria-label="Error steps" />
        <div style={{ marginTop: 'var(--tz-space-md)' }}>
          <Stepper
            orientation="vertical"
            steps={ERROR_STEPS}
            activeStep={2}
            aria-label="Vertical error steps"
          />
        </div>
      </Block>

      {/* per-step overrides — forced completed + disabled */}
      <Block
        label="Completed & Disabled"
        description="completed: true forces the done look regardless of activeStep (an already-saved step); disabled dims the step and (when clickable) it can't be selected — try clicking Locked."
      >
        <Stepper
          steps={STATE_STEPS}
          activeStep={sStep}
          onStepClick={setSStep}
          aria-label="Stateful steps"
        />
      </Block>

      {/* sizes */}
      <Block
        label="Sizes"
        description="sm · md · lg — the circle, number, and label scale together."
      >
        {SIZES.map((size) => (
          <div key={size} style={{ marginBottom: 'var(--tz-space-md)' }}>
            <Typography variant="caption" color="muted" as="div" style={{ marginBottom: 4 }}>
              {size}
            </Typography>
            <Stepper steps={BASIC} activeStep={1} size={size} aria-label={`${size} steps`} />
          </div>
        ))}
      </Block>

      {/* colors */}
      <Block
        label="Colors"
        description="color tints the completed / active circles and connectors via the shared --tz-btn-rgb pattern."
      >
        {(['primary', 'medium', 'success', 'warning'] as const).map((color) => (
          <div key={color} style={{ marginBottom: 'var(--tz-space-md)' }}>
            <Typography variant="caption" color="muted" as="div" style={{ marginBottom: 4 }}>
              {cap(color)}
            </Typography>
            <Stepper steps={BASIC} activeStep={2} color={color} aria-label={`${color} steps`} />
          </div>
        ))}
      </Block>

      {/* overflow — many steps scroll sideways, the active one kept in view */}
      <Block
        label="Many Steps (sideways scroll)"
        description="When the steps overflow the container the strip scrolls sideways (scrollbar hidden) and the active step is kept in view — walk with Back / Next and watch the strip follow."
      >
        <Stepper steps={MANY} activeStep={mStep} aria-label="Many steps" />
        <Row gap="xs" style={{ marginTop: 'var(--tz-space-md)' }}>
          <Button
            variant="outlined"
            disabled={mStep === 0}
            onClick={() => setMStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          <Button
            disabled={mStep === MANY.length - 1}
            onClick={() => setMStep((s) => Math.min(MANY.length - 1, s + 1))}
          >
            Next
          </Button>
        </Row>
      </Block>
    </Section>
  )
}
