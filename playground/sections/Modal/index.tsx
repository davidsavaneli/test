import { useState } from 'react'
import { z } from 'zod'
import {
  Button,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Grid,
  Modal,
  type ModalScrollBehavior,
  type ModalSize,
  Row,
  Select,
  TextField,
  Typography,
  useDisclosure,
  useForm,
} from '../../../src'
import { Block, cap, Section } from '../../shared'

const SIZES: ModalSize[] = ['sm', 'md', 'lg', 'fullScreen']
const SIZE_LABEL: Record<ModalSize, string> = {
  sm: 'Small',
  md: 'Medium',
  lg: 'Large',
  fullScreen: 'Full Screen',
}

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
]

/** Brand colors exercised by the icon-box demo. */
const ICON_COLORS = ['medium', 'success', 'info', 'warning', 'error'] as const

const schema = z.object({
  name: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email'),
  role: z.string().min(1, 'Pick a role'),
  startDate: z.string().min(1, 'Pick a date'),
  agree: z.boolean().refine((v) => v, 'Required'),
})

/** A modal whose body is a validated `<Form>`; the footer Submit targets it via the `form` attribute. */
function FormModal() {
  const { isOpen, open, close } = useDisclosure()
  const [saved, setSaved] = useState<string | null>(null)
  const form = useForm({
    schema,
    defaultValues: { name: '', email: '', role: '', startDate: '', agree: false },
    onSubmit: async (values, { reset }) => {
      await new Promise((r) => setTimeout(r, 600)) // simulate a save request
      setSaved(JSON.stringify(values))
      reset()
      close()
    },
  })

  const openFresh = () => {
    form.reset()
    setSaved(null)
    open()
  }

  return (
    <>
      <Row gap={16} wrap align="center">
        <Button onClick={openFresh}>New Member</Button>
        {saved && (
          <Typography variant="bodySmall" color="muted">
            Saved: {saved}
          </Typography>
        )}
      </Row>

      <Modal
        open={isOpen}
        onClose={close}
        icon="ProfileAdd"
        title="New Member"
        description="Invite a teammate. Submitting validates first and scrolls to the first error."
        footer={
          <>
            <Button variant="text" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" form="member-form" loading={form.isSubmitting}>
              Save Member
            </Button>
          </>
        }
      >
        <Form form={form} id="member-form">
          <Col gap={16}>
            <TextField name="name" required label="Full Name" placeholder="Jane Doe" />
            <TextField name="email" required label="Email" placeholder="jane@techzy.app" />
            <Grid minItemWidth={200} gap={16}>
              <Select name="role" required label="Role" placeholder="Pick a role" options={ROLES} />
              <DatePicker name="startDate" required label="Start Date" />
            </Grid>
            <Checkbox name="agree" label="I agree to the terms" />
          </Col>
        </Form>
      </Modal>
    </>
  )
}

export function ModalSection() {
  const [size, setSize] = useState<ModalSize | null>(null)
  const [scroll, setScroll] = useState<ModalScrollBehavior | null>(null)
  const [iconColor, setIconColor] = useState<(typeof ICON_COLORS)[number] | null>(null)
  const confirm = useDisclosure()
  const locked = useDisclosure()

  return (
    <Section>
      <Block label="Sizes — sm / md / lg / full screen">
        <Row gap={16} wrap>
          {SIZES.map((s) => (
            <Button key={s} variant="outlined" onClick={() => setSize(s)}>
              {SIZE_LABEL[s]}
            </Button>
          ))}
        </Row>
        <Modal
          open={size !== null}
          onClose={() => setSize(null)}
          size={size ?? 'md'}
          icon="Maximize3"
          title={`${SIZE_LABEL[size ?? 'md']} Modal`}
          description="The dialog is centered, dims the page, locks scroll, and traps focus."
          footer={<Button onClick={() => setSize(null)}>Done</Button>}
        >
          <Typography>
            Use a Modal for focused, interruptive tasks — confirmations, quick forms, or detail
            views. Press Escape, click the backdrop, or use the close button to dismiss it.
          </Typography>
        </Modal>
      </Block>

      <Block label="Confirm dialog — icon + title + description + actions">
        <Button color="error" onClick={confirm.open}>
          Delete Item
        </Button>
        <Modal
          open={confirm.isOpen}
          onClose={confirm.close}
          size="sm"
          icon="Trash"
          color="error"
          title="Delete item?"
          description="This action can't be undone. The item will be permanently removed."
          footer={
            <>
              <Button variant="text" onClick={confirm.close}>
                Cancel
              </Button>
              <Button color="error" onClick={confirm.close}>
                Delete
              </Button>
            </>
          }
        />
      </Block>

      <Block
        label="Icon color — the header icon box is tinted by the color prop (like Card)"
        description="color also tints any matching footer action; the close button stays neutral."
      >
        <Row gap={12} wrap>
          {ICON_COLORS.map((c) => (
            <Button key={c} variant="filled" color={c} onClick={() => setIconColor(c)}>
              {cap(c)}
            </Button>
          ))}
        </Row>
        <Modal
          open={iconColor !== null}
          onClose={() => setIconColor(null)}
          size="sm"
          icon="Star"
          color={iconColor ?? 'medium'}
          title={`${cap(iconColor ?? 'medium')} Modal`}
          description={`color="${iconColor ?? 'medium'}" tints the leading icon box`}
          footer={
            <Button color={iconColor ?? 'medium'} onClick={() => setIconColor(null)}>
              Done
            </Button>
          }
        >
          <Typography>
            The leading icon box (and any tinted action) follows the color prop.
          </Typography>
        </Modal>
      </Block>

      <Block
        label="Options — no close button, backdrop locked"
        description="Closes only via its own button (no × header button, backdrop + Escape disabled)."
      >
        <Button variant="outlined" onClick={locked.open}>
          Open Locked Modal
        </Button>
        <Modal
          open={locked.isOpen}
          onClose={locked.close}
          icon="InfoCircle"
          color="warning"
          title="Heads up"
          showCloseButton={false}
          closeOnBackdrop={false}
          closeOnEscape={false}
          footer={<Button onClick={locked.close}>Got It</Button>}
        >
          <Typography>
            This modal ignores the backdrop and Escape — useful for steps the user must acknowledge.
          </Typography>
        </Modal>
      </Block>

      <Block
        label="Scroll behavior — inside (body scrolls) vs outside (the whole dialog scrolls)"
        description="Long content: inside pins the header + footer and scrolls the body; outside grows the dialog and scrolls the overlay."
      >
        <Row gap={16} wrap>
          <Button variant="outlined" onClick={() => setScroll('inside')}>
            Inside Scroll
          </Button>
          <Button variant="outlined" onClick={() => setScroll('outside')}>
            Outside Scroll
          </Button>
        </Row>
        <Modal
          open={scroll !== null}
          onClose={() => setScroll(null)}
          scrollBehavior={scroll ?? 'inside'}
          icon="DocumentText"
          title="Terms of Service"
          description={`scrollBehavior="${scroll ?? 'inside'}"`}
          footer={<Button onClick={() => setScroll(null)}>Close</Button>}
        >
          <Col gap={12}>
            {Array.from({ length: 16 }, (_, i) => (
              <Typography key={i}>
                {i + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
              </Typography>
            ))}
          </Col>
        </Modal>
      </Block>

      <Block
        label="Form modal — validation inside a dialog"
        description="The body is a <Form>; the footer Submit targets it via the form attribute (works across the portal)."
      >
        <FormModal />
      </Block>
    </Section>
  )
}
