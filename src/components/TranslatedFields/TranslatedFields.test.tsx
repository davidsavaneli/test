import { createRef } from 'react'
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { z } from 'zod'
import { ConfigProvider } from '../../theme'
import { Form } from '../../form/Form'
import { useForm } from '../../form/useForm'
import { TextField } from '../TextField'
import { TranslatedFields } from './TranslatedFields'
import { buildTranslations } from '../../helpers/translations'

const LOCALES = [
  { code: 'en-US', label: 'English' },
  { code: 'ka-GE', label: 'ქართული' },
]

describe('TranslatedFields', () => {
  it('renders a tab per locale (label falls back to the code)', () => {
    render(
      <TranslatedFields locales={[{ code: 'en-US', label: 'English' }, { code: 'ka-GE' }]}>
        {() => null}
      </TranslatedFields>,
    )
    expect(screen.getByRole('tab', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'ka-GE' })).toBeInTheDocument() // fallback to code
  })

  it('gives the render-prop a locale-namespaced name builder (active tab)', () => {
    render(
      <TranslatedFields locales={LOCALES}>
        {(name) => <input aria-label="title" name={name('title')} />}
      </TranslatedFields>,
    )
    expect(screen.getByLabelText('title')).toHaveAttribute('name', 'translations[en-US].title')
  })

  it('switches the field names when another locale tab is selected', () => {
    render(
      <TranslatedFields locales={LOCALES}>
        {(name) => <input aria-label="title" name={name('title')} />}
      </TranslatedFields>,
    )
    fireEvent.click(screen.getByRole('tab', { name: 'ქართული' }))
    expect(screen.getByLabelText('title')).toHaveAttribute('name', 'translations[ka-GE].title')
  })

  it('applies a custom namespace', () => {
    render(
      <TranslatedFields locales={LOCALES} namespace="languages">
        {(name) => <input aria-label="title" name={name('title')} />}
      </TranslatedFields>,
    )
    expect(screen.getByLabelText('title')).toHaveAttribute('name', 'languages[en-US].title')
  })

  it('uses the namespace from ConfigProvider config when no prop is given', () => {
    render(
      <ConfigProvider config={{ translations: { namespace: 'languages' }, locales: LOCALES }}>
        <TranslatedFields>
          {(name) => <input aria-label="title" name={name('title')} />}
        </TranslatedFields>
      </ConfigProvider>,
    )
    expect(screen.getByLabelText('title')).toHaveAttribute('name', 'languages[en-US].title')
  })

  it('lets the namespace prop override the ConfigProvider config', () => {
    render(
      <ConfigProvider config={{ translations: { namespace: 'languages' }, locales: LOCALES }}>
        <TranslatedFields namespace="i18n">
          {(name) => <input aria-label="title" name={name('title')} />}
        </TranslatedFields>
      </ConfigProvider>,
    )
    expect(screen.getByLabelText('title')).toHaveAttribute('name', 'i18n[en-US].title')
  })

  it('reads locales from the ConfigProvider config when no prop is given', () => {
    render(
      <ConfigProvider config={{ locales: [{ code: 'fr-FR', label: 'Français' }] }}>
        <TranslatedFields>{() => null}</TranslatedFields>
      </ConfigProvider>,
    )
    expect(screen.getByRole('tab', { name: 'Français' })).toBeInTheDocument()
  })

  it('renders nothing without any locales', () => {
    const { container } = render(<TranslatedFields locales={[]}>{() => null}</TranslatedFields>)
    expect(container).toBeEmptyDOMElement()
  })

  it('binds its fields to a surrounding <Form> by the namespaced name', () => {
    function Harness() {
      const form = useForm({
        schema: z.object(buildTranslations(['en-US', 'ka-GE'], { title: z.string() })),
        defaultValues: buildTranslations(['en-US', 'ka-GE'], { title: '' }),
      })
      return (
        <Form form={form}>
          <TranslatedFields locales={LOCALES}>
            {(name) => <TextField name={name('title')} label="Title" />}
          </TranslatedFields>
        </Form>
      )
    }
    render(<Harness />)
    const input = screen.getByLabelText('Title') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Hello' } })
    expect(input.value).toBe('Hello')
    expect(input).toHaveAttribute('name', 'translations[en-US].title')
  })

  it('marks an incomplete locale tab with a dot (not an error tint) after submit', () => {
    function Harness() {
      const form = useForm({
        schema: z.object(
          buildTranslations(['en-US', 'ka-GE'], { title: z.string().min(1, 'Required') }),
        ),
        defaultValues: buildTranslations(['en-US', 'ka-GE'], { title: '' }),
        scrollToError: false,
      })
      return (
        <Form form={form}>
          <TranslatedFields locales={LOCALES}>
            {(name) => <TextField name={name('title')} label="Title" />}
          </TranslatedFields>
          <button type="submit">Save</button>
        </Form>
      )
    }
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    const en = screen.getByRole('tab', { name: 'English' })
    expect(en).not.toHaveClass('error') // no red tint
    expect(en.querySelector('.dot')).toBeInTheDocument() // dot indicator instead
    expect(screen.getByRole('tab', { name: 'ქართული' }).querySelector('.dot')).toBeInTheDocument()
  })

  it('switches to the first incomplete locale on submit when the active one is complete', () => {
    function Harness() {
      const form = useForm({
        schema: z.object(
          buildTranslations(['en-US', 'ka-GE'], { title: z.string().min(1, 'Required') }),
        ),
        defaultValues: { 'translations[en-US].title': 'Filled', 'translations[ka-GE].title': '' },
        scrollToError: false,
      })
      return (
        <Form form={form}>
          <TranslatedFields locales={LOCALES}>
            {(name) => <TextField name={name('title')} label="Title" />}
          </TranslatedFields>
          <button type="submit">Save</button>
        </Form>
      )
    }
    render(<Harness />)
    expect(screen.getByRole('tab', { name: 'English' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    // en-US is complete, ka-GE isn't → the strip auto-advances to ka-GE
    expect(screen.getByRole('tab', { name: 'ქართული' })).toHaveAttribute('aria-selected', 'true')
  })

  it('forwards the ref to the tablist root', () => {
    const ref = createRef<HTMLDivElement>()
    render(
      <TranslatedFields ref={ref} locales={LOCALES}>
        {() => null}
      </TranslatedFields>,
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })
})
