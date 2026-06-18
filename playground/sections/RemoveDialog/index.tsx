import { useState } from 'react'
import { Button, RemoveDialog, Typography, useDisclosure } from '../../../src'
import { Block, Section } from '../../shared'

export function RemoveDialogSection() {
  const basic = useDisclosure()
  const custom = useDisclosure()
  const asyncDlg = useDisclosure()
  const [status, setStatus] = useState<string | null>(null)

  return (
    <Section>
      <Block
        label="Basic — the default delete confirmation"
        description="Wire open / onClose / onConfirm; the Trash glyph, error color, and Delete label are built in."
      >
        <Button
          color="error"
          onClick={() => {
            setStatus(null)
            basic.open()
          }}
        >
          Delete Item
        </Button>
        <RemoveDialog
          open={basic.isOpen}
          onClose={basic.close}
          onConfirm={() => setStatus('Item deleted.')}
        />
        {status && (
          <Typography variant="bodySmall" color="muted">
            {status}
          </Typography>
        )}
      </Block>

      <Block label="Custom — title / message / labels">
        <Button variant="outlined" color="error" onClick={custom.open}>
          Remove User
        </Button>
        <RemoveDialog
          open={custom.isOpen}
          onClose={custom.close}
          onConfirm={custom.close}
          title="Remove User"
          message="Jane Doe will lose access immediately. This can’t be undone."
          confirmLabel="Remove"
        />
      </Block>

      <Block
        label="Async confirm — loader + auto-close"
        description="onConfirm returns a Promise: the Delete button shows a loader, the dialog locks (no dismiss), then auto-closes on success."
      >
        <Button color="error" onClick={asyncDlg.open}>
          Delete (async)
        </Button>
        <RemoveDialog
          open={asyncDlg.isOpen}
          onClose={asyncDlg.close}
          onConfirm={() => new Promise((resolve) => setTimeout(resolve, 1200))}
        />
      </Block>
    </Section>
  )
}
