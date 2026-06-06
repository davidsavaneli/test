import { useNavigate, useParams } from '@tanstack/react-router'
import { z } from 'zod'
import {
  Avatar,
  Button,
  Col,
  Form,
  Grid,
  Icon,
  Row,
  TextField,
  Typography,
  useForm,
} from '../../../src'

// Casts: the playground's code-based router isn't `Register`-typed, so `to`/`params` are loose.
const go = (opts: { to: string; params?: Record<string, string> }) => opts as never

const USERS = [
  { id: '101', name: 'David Savaneli', email: 'david@techzy.app' },
  { id: '102', name: 'Mariam Kapanadze', email: 'mariam@techzy.app' },
  { id: '103', name: 'Nino Beridze', email: 'nino@techzy.app' },
]

/** `/users` index — a normal page (in the sidebar) linking to dynamic detail / add / edit routes. */
export function UsersListBody() {
  const navigate = useNavigate()
  return (
    <Col gap={16}>
      <Row justify="between" gap={12}>
        <Typography color="tertiary">
          The detail / add / edit routes below are dynamic — none appear in the sidebar.
        </Typography>
        <Button startIcon={<Icon name="Add" />} onClick={() => navigate(go({ to: '/users/new' }))}>
          New User
        </Button>
      </Row>

      <Col gap={8}>
        {USERS.map((u) => (
          <Row
            key={u.id}
            justify="between"
            gap={12}
            padding="sm"
            style={{ border: '1px solid var(--tz-color-border)', borderRadius: 8 }}
          >
            <Row gap={12}>
              <Avatar name={u.name} size="sm" />
              <Col gap={2}>
                <Typography>{u.name}</Typography>
                <Typography variant="caption" color="tertiary">
                  /users/{u.id}
                </Typography>
              </Col>
            </Row>
            <Row gap={4}>
              <Button
                size="sm"
                variant="outlined"
                onClick={() => navigate(go({ to: '/users/$userId', params: { userId: u.id } }))}
              >
                Open
              </Button>
              <Button
                size="sm"
                variant="text"
                onClick={() =>
                  navigate(go({ to: '/users/$userId/edit', params: { userId: u.id } }))
                }
              >
                Edit
              </Button>
            </Row>
          </Row>
        ))}
      </Col>
    </Col>
  )
}

/** `/users/$userId` — DYNAMIC detail. No `staticData.name` ⇒ routed + rendered, never in the sidebar. */
export function UserDetailBody() {
  const navigate = useNavigate()
  const { userId } = useParams({ strict: false }) as { userId?: string }
  const user = USERS.find((u) => u.id === userId)
  return (
    <Col gap={16} style={{ maxWidth: 480 }}>
      <Row gap={12}>
        <Avatar name={user?.name ?? `User ${userId}`} size="lg" />
        <Col gap={2}>
          <Typography variant="h3">{user?.name ?? `User #${userId}`}</Typography>
          <Typography color="tertiary">{user?.email ?? `/users/${userId}`}</Typography>
        </Col>
      </Row>
      <Typography variant="bodySmall" color="tertiary">
        This is <code>/users/{userId}</code> — a dynamic <code>$userId</code> route. It routes and
        renders normally; it’s not listed in the sidebar.
      </Typography>
      <Row gap={8}>
        <Button
          onClick={() => navigate(go({ to: '/users/$userId/edit', params: { userId: userId! } }))}
        >
          Edit
        </Button>
        <Button variant="text" onClick={() => navigate(go({ to: '/users' }))}>
          ← Back
        </Button>
      </Row>
    </Col>
  )
}

const userSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Enter a valid email'),
  role: z.string().min(1, 'Required'),
})

/** `/users/new` and `/users/$userId/edit` — one add/update form. Dynamic; off the sidebar. */
export function UserFormBody() {
  const navigate = useNavigate()
  const { userId } = useParams({ strict: false }) as { userId?: string }
  const isEdit = Boolean(userId)
  const existing = USERS.find((u) => u.id === userId)

  const form = useForm({
    schema: userSchema,
    defaultValues:
      isEdit && existing
        ? {
            firstName: existing.name.split(' ')[0] ?? '',
            lastName: existing.name.split(' ')[1] ?? '',
            email: existing.email,
            role: 'Admin',
          }
        : { firstName: '', lastName: '', email: '', role: '' },
    onSubmit: (values) => {
      alert(
        `${isEdit ? `Updated user #${userId}` : 'Created user'}:\n${JSON.stringify(values, null, 2)}`,
      )
      navigate(go({ to: '/users' }))
    },
  })

  return (
    <Col gap={16} style={{ maxWidth: 520 }}>
      <Typography variant="h3">{isEdit ? `Edit user #${userId}` : 'New user'}</Typography>
      <Typography variant="bodySmall" color="tertiary">
        One form for both add (<code>/users/new</code>) and update (<code>/users/$userId/edit</code>
        ) — dynamic routes that stay off the sidebar.
      </Typography>
      <Form form={form}>
        <Col gap={16}>
          <Grid minItemWidth={200} gap={16}>
            <TextField name="firstName" required label="First Name" placeholder="David" />
            <TextField name="lastName" required label="Last Name" placeholder="Savaneli" />
            <TextField name="email" required label="Email" placeholder="you@example.com" />
            <TextField name="role" required label="Role" placeholder="Admin" />
          </Grid>
          <Row gap={8}>
            <Button type="submit" loading={form.isSubmitting}>
              {isEdit ? 'Save changes' : 'Create user'}
            </Button>
            <Button type="button" variant="text" onClick={() => navigate(go({ to: '/users' }))}>
              Cancel
            </Button>
          </Row>
        </Col>
      </Form>
    </Col>
  )
}
