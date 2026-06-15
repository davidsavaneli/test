import { useMemo, useState, type ReactNode } from 'react'
import { z } from 'zod'
import {
  Button,
  buildTranslations,
  Col,
  flattenTranslations,
  Form,
  Grid,
  MultilineTextField,
  MultiSelect,
  nestTranslations,
  NumberField,
  RichTextEditor,
  Switch,
  TagsField,
  TextField,
  toFormData,
  TranslatedFields,
  useForm,
  useLocales,
} from '../../../src'
import { Block, Section } from '../../shared'

// ── shared field set (identical on all three pages, so the submit shapes are comparable) ───────────

const CATEGORIES = [
  { value: 'design', label: 'Design' },
  { value: 'eng', label: 'Engineering' },
  { value: 'product', label: 'Product' },
  { value: 'data', label: 'Data' },
]

/** A nested server response — flattened into the Edit page's defaults so the fields arrive filled. */
const TEST_RESPONSE = {
  email: 'hello@techzy.app',
  quantity: 5,
  tags: ['news', 'featured'],
  categories: ['design', 'eng'],
  published: true,
  body: '<h2>Edit me</h2><p>Prefilled <strong>rich</strong> content.</p>',
  translations: {
    'en-US': { title: 'test NEWS', description: '<p>testing</p>' },
    'ka-GE': { title: 'ტესტტესტ', description: '<p>ტესტ</p>' },
  },
}

const buildSchema = (codes: string[]) => {
  const shape: z.ZodRawShape = {
    email: z.string().email('Enter a valid email'),
    quantity: z
      .number()
      .min(1, 'At least 1')
      .nullable()
      .refine((v): boolean => v !== null, 'Required'),
    tags: z.array(z.string()).min(1, 'Add at least one tag'),
    categories: z.array(z.string()).min(1, 'Pick at least one'),
    published: z.boolean(),
    // RTE value is HTML, but a blank editor emits '' (not <p><br></p>), so min(1) is enough
    body: z.string().min(1, 'Required'),
    ...buildTranslations(codes, {
      title: z.string().min(1, 'Required'),
      description: z.string().min(1, 'Required'),
    }),
  }
  return z.object(shape)
}

const buildDefaults = (codes: string[]) => ({
  email: '',
  quantity: null as number | null,
  tags: [] as string[],
  categories: [] as string[],
  published: false,
  body: '',
  ...buildTranslations(codes, { title: '', description: '' }),
})

function Fields() {
  return (
    <Col gap={16}>
      <Grid minItemWidth={240} gap={16}>
        <TextField name="email" required label="Email" placeholder="you@example.com" />
        <NumberField name="quantity" required label="Quantity" min={0} />
      </Grid>
      <TagsField name="tags" required label="Tags" placeholder="Add a tag, press Enter…" />
      <MultiSelect
        name="categories"
        required
        label="Categories"
        placeholder="Pick a few…"
        options={CATEGORIES}
      />
      <Switch name="published" label="Published" />
      <RichTextEditor
        name="body"
        required
        label="Body"
        placeholder="Write the article…"
        minHeight={160}
      />
      <TranslatedFields>
        {(name) => (
          <>
            <TextField name={name('title')} required label="Title" />
            <MultilineTextField
              name={name('description')}
              required
              label="Description"
              minRows={3}
            />
          </>
        )}
      </TranslatedFields>
    </Col>
  )
}

function Output({ children }: { children: ReactNode }) {
  return (
    <pre
      style={{
        margin: 0,
        padding: 'var(--tz-space-sm)',
        background: 'var(--tz-color-secondary)',
        border: '1px solid var(--tz-color-border)',
        borderRadius: 'var(--tz-radius-sm)',
        fontSize: 'var(--tz-font-size-sm)',
        color: 'var(--tz-color-text)',
        whiteSpace: 'pre-wrap',
        overflowX: 'auto',
      }}
    >
      {children}
    </pre>
  )
}

function FormShell({
  label,
  description,
  form,
  output,
}: {
  label: string
  description: string
  form: ReturnType<typeof useNewsForm>
  output: string | null
}) {
  return (
    <Section>
      <Block label={label} description={description}>
        <Col gap={16} style={{ maxWidth: 560 }}>
          <Form form={form}>
            <Col gap={16}>
              <Fields />
              <div>
                <Button type="submit" loading={form.isSubmitting}>
                  Submit
                </Button>
              </div>
            </Col>
          </Form>
          {output != null && <Output>{output}</Output>}
        </Col>
      </Block>
    </Section>
  )
}

/** Shared form setup — locales drive the schema/defaults; the page picks how to serialize on submit. */
function useNewsForm(
  onSubmit: (values: Record<string, unknown>) => void,
  defaults?: Record<string, unknown>,
) {
  const locales = useLocales()
  const codes = useMemo(() => locales.map((l) => l.code), [locales])
  const schema = useMemo(() => buildSchema(codes), [codes])
  const defaultValues = useMemo(() => defaults ?? buildDefaults(codes), [codes, defaults])
  return useForm({ schema, defaultValues, onSubmit })
}

// ── pages ───────────────────────────────────────────────────────────────────────────────────────

export function FormSection() {
  const [output, setOutput] = useState<string | null>(null)
  const form = useNewsForm((values) => setOutput(JSON.stringify(nestTranslations(values), null, 2)))
  return (
    <FormShell
      label="JSON — translations nest under one object"
      description="Submitting POSTs JSON: nestTranslations() folds the flat fields into { translations: { 'en-US': { … } } }."
      form={form}
      output={output}
    />
  )
}

export function FormDataSection() {
  const [output, setOutput] = useState<string | null>(null)
  const form = useNewsForm((values) => {
    const fd = toFormData(values)
    setOutput([...fd.entries()].map(([key, value]) => `${key} = ${value}`).join('\n'))
  })
  return (
    <FormShell
      label="FormData — flat bracket keys for multipart/form-data"
      description="Submitting builds FormData via toFormData(): translations[en-US].title, arrays as tags[0], etc. (shown as key = value below)."
      form={form}
      output={output}
    />
  )
}

export function FormEditSection() {
  const defaults = useMemo(() => flattenTranslations(TEST_RESPONSE), [])
  const [output, setOutput] = useState<string | null>(null)
  const form = useNewsForm(
    (values) => setOutput(JSON.stringify(nestTranslations(values), null, 2)),
    defaults,
  )
  return (
    <FormShell
      label="Edit — prefilled from a server response"
      description="A nested response is flattenTranslations()'d into the form defaults, so every field (incl. both locale tabs) arrives filled and ready to edit."
      form={form}
      output={output}
    />
  )
}
