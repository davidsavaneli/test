import { Button, Row, Typography, toast } from '../../../src'
import { Block, Section } from '../../shared'

export function ToastSection() {
  return (
    <Section>
      <Typography variant="bodySmall" color="muted">
        The <code>&lt;Toaster /&gt;</code> is mounted once at the app root (bottom-right). Fire
        toasts from anywhere with the imperative <code>toast</code> API.
      </Typography>

      <Block label="Semantic toasts — each picks its color + icon">
        <Row gap={12} wrap>
          <Button color="success" onClick={() => toast.success('Profile saved.')}>
            Success
          </Button>
          <Button color="error" onClick={() => toast.error('Something went wrong.')}>
            Error
          </Button>
          <Button color="warning" onClick={() => toast.warning('Your session expires soon.')}>
            Warning
          </Button>
          <Button color="info" onClick={() => toast.info('A new version is available.')}>
            Info
          </Button>
          <Button variant="outlined" onClick={() => toast('Just so you know…')}>
            Default
          </Button>
        </Row>
      </Block>

      <Block
        label="With an action — a trailing button (e.g. Undo)"
        description="The toast stays until the action or × is used (duration: Infinity)."
      >
        <Button
          variant="outlined"
          onClick={() =>
            toast.success('Item deleted.', {
              duration: Infinity,
              action: (
                <Button variant="text" color="info" size="sm" onClick={() => toast.dismiss()}>
                  Undo
                </Button>
              ),
            })
          }
        >
          Delete With Undo
        </Button>
      </Block>

      <Block
        label="Variants + control"
        description="Per-toast variant, a long-lived toast, and dismiss-all."
      >
        <Row gap={12} wrap>
          <Button
            variant="outlined"
            onClick={() => toast.info('Soft filled toast.', { variant: 'filled' })}
          >
            Filled
          </Button>
          <Button
            variant="outlined"
            onClick={() => toast.warning('I’ll stick around for 10s.', { duration: 10000 })}
          >
            Long (10s)
          </Button>
          <Button
            variant="text"
            color="error"
            onClick={() => {
              toast.info('One')
              toast.success('Two')
              toast.warning('Three')
            }}
          >
            Stack Three
          </Button>
          <Button variant="text" onClick={() => toast.dismiss()}>
            Dismiss All
          </Button>
        </Row>
      </Block>
    </Section>
  )
}
