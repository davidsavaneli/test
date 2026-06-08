import { z } from 'zod'
import {
  Button,
  Checkbox,
  Col,
  Form,
  Grid,
  NumberField,
  RadioGroup,
  Switch,
  TextField,
  Typography,
  useForm,
} from '../../../src'
import { Block, Section } from '../../shared'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().min(1, 'Required'),
  company: z.string().min(1, 'Required'),
  address: z.string().min(1, 'Required'),
  city: z.string().min(1, 'Required'),
  password: z.string().min(6, 'At least 6 characters'),
  // nullable so the field can start empty; `: boolean` stops TS from inferring a type-predicate.
  quantity: z
    .number()
    .min(1, 'At least 1')
    .max(10, 'Max 10')
    .nullable()
    .refine((v): boolean => v !== null, 'Required'),
  plan: z.string().min(1, 'Select a plan'),
  notifications: z.boolean().refine((v) => v, 'Enable notifications to continue'),
  acceptTerms: z.boolean().refine((v) => v, 'You must accept the terms'),
})

export function FormSection() {
  const form = useForm({
    schema,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      city: '',
      password: '',
      quantity: null,
      plan: '',
      notifications: false,
      acceptTerms: false,
    },
    onSubmit: (values, { reset }) => {
      alert(`Submitted:\n${JSON.stringify(values, null, 2)}`)
      reset()
    },
  })

  return (
    <Section>
      <Block label="validation — submit empty to scroll to the first red field">
        <Col gap={16} style={{ maxWidth: 560 }}>
          <Typography variant="bodySmall" color="muted">
            Press “Sign Up” with fields empty — the page smooth-scrolls to (and focuses) the topmost
            invalid field. Fill the top ones and submit again to watch it jump to the next.
          </Typography>
          <Form form={form}>
            <Col gap={16}>
              <Grid minItemWidth={220} gap={16}>
                <TextField name="firstName" required label="First Name" placeholder="David" />
                <TextField name="lastName" required label="Last Name" placeholder="Savaneli" />
                <TextField name="email" required label="Email" placeholder="you@example.com" />
                <TextField name="phone" required label="Phone" placeholder="(555) 123-4567" />
                <TextField name="company" required label="Company" placeholder="Techzy" />
                <TextField name="city" required label="City" placeholder="Tbilisi" />
                <TextField name="address" required label="Address" placeholder="123 Main St" />
                <TextField
                  name="password"
                  required
                  type="password"
                  label="Password"
                  placeholder="••••••"
                />
                <NumberField name="quantity" required label="Quantity" min={0} max={10} />
              </Grid>
              <RadioGroup
                name="plan"
                required
                label="Plan"
                orientation="horizontal"
                options={[
                  { value: 'free', label: 'Free' },
                  { value: 'pro', label: 'Pro' },
                  { value: 'team', label: 'Team' },
                ]}
              />
              <Switch name="notifications" required label="Enable notifications" />
              <Checkbox name="acceptTerms" required label="I accept the terms" />
              <Button type="submit" loading={form.isSubmitting}>
                Sign Up
              </Button>
            </Col>
          </Form>
        </Col>
      </Block>
    </Section>
  )
}
