import { Tabs } from '../../../src'
import { FormSection, FormDataSection, FormEditSection } from '../Form'

/**
 * The Form Validations page — the three Zod-validated `useForm` demos gathered under one page, switched
 * with Tabs (JSON submit · FormData submit · Edit / prefilled). `queryKey={null}` keeps these tabs out
 * of the URL (each form already manages its own state + nested locale tabs).
 */
export function FormValidationsSection() {
  return (
    <Tabs
      queryKey={null}
      aria-label="Form validation examples"
      items={[
        { value: 'json', label: 'JSON', icon: 'Edit', content: <FormSection /> },
        {
          value: 'form-data',
          label: 'FormData',
          icon: 'DocumentUpload',
          content: <FormDataSection />,
        },
        { value: 'edit', label: 'Edit', icon: 'Translate', content: <FormEditSection /> },
      ]}
    />
  )
}
