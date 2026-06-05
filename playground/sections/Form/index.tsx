import { z } from 'zod'
import { Button, Checkbox, Form, NumberField, TextField, useForm } from '../../../src'
import { Block, Section } from '../../shared'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  // nullable so the field can start empty (null); the `: boolean` annotation stops TS 6 from
  // inferring a `v is number` type-predicate (which would narrow the type and break the null default).
  quantity: z
    .number()
    .min(1, 'At least 1')
    .max(10, 'Max 10')
    .nullable()
    .refine((v): boolean => v !== null, 'Required'),
  acceptTerms: z.boolean().refine((v) => v, 'You must accept the terms'),
})

export function FormSection() {
  const form = useForm({
    schema: loginSchema,
    defaultValues: { email: '', password: '', quantity: null, acceptTerms: false },
    onSubmit: (values, { reset }) => {
      alert(`Submitted:\n${JSON.stringify(values, null, 2)}`)
      reset() // clear the fields after a successful submit
    },
  })

  return (
    <Section>
      <Block label="validation — bind by name (blur, then live)">
        <Form
          form={form}
          style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 360 }}
        >
          <TextField name="email" required label="Email" placeholder="you@example.com" fullWidth />
          <TextField
            name="password"
            required
            type="password"
            label="Password"
            placeholder="••••••"
            fullWidth
          />
          <NumberField name="quantity" required label="Quantity" min={0} max={10} fullWidth />
          <Checkbox name="acceptTerms" required label="I accept the terms" />
          <Button type="submit" loading={form.isSubmitting}>
            Sign In
          </Button>
        </Form>
      </Block>
    </Section>
  )
}
