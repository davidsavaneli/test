import { useState } from 'react'
import { Col, Divider, Icon, List, ListItem } from '../../../src'
import { Block, Section } from '../../shared'

// A surface panel that frames a list to look like a dropdown menu.
const panel = {
  width: 260,
  border: '1px solid var(--tz-color-border)',
  borderRadius: 'var(--tz-radius-md)',
  background: 'var(--tz-color-surface)',
  boxShadow: 'var(--tz-shadow-md)',
} as const

export function ListSection() {
  const [active, setActive] = useState('settings')

  return (
    <Section>
      <Block label="standalone list — icon · label · description · trailing">
        <List style={{ maxWidth: 420 }}>
          <ListItem
            icon="User"
            description="Name, photo and email"
            trailing={<Icon name="ArrowRight2" />}
            clickable
          >
            Profile
          </ListItem>
          <ListItem
            icon="Notification"
            description="Push, email and SMS alerts"
            trailing={<Icon name="ArrowRight2" />}
            clickable
          >
            Notifications
          </ListItem>
          <ListItem
            icon="Lock"
            description="Password and two-factor auth"
            trailing={<Icon name="ArrowRight2" />}
            clickable
          >
            Security
          </ListItem>
        </List>
      </Block>

      <Block label="dropdown menu — clickable · selected · disabled (role=menu)">
        <div style={panel}>
          <List padding={4} role="menu">
            <ListItem
              icon="User"
              clickable
              selected={active === 'profile'}
              onClick={() => setActive('profile')}
            >
              Profile
            </ListItem>
            <ListItem
              icon="Setting2"
              clickable
              selected={active === 'settings'}
              onClick={() => setActive('settings')}
            >
              Settings
            </ListItem>
            <ListItem
              icon="Copy"
              clickable
              selected={active === 'duplicate'}
              onClick={() => setActive('duplicate')}
            >
              Duplicate
            </ListItem>
            <Divider />
            <ListItem icon={<Icon name="Trash" color="error" />} clickable>
              Delete
            </ListItem>
            <ListItem icon="Lock" clickable disabled>
              Locked action
            </ListItem>
          </List>
        </div>
      </Block>

      <Block label="sizes — sm · md · lg">
        <List style={{ maxWidth: 420 }}>
          <ListItem
            size="sm"
            icon="Menu"
            trailing={<Icon name="ArrowRight2" size="sm" />}
            clickable
          >
            Small row
          </ListItem>
          <ListItem size="md" icon="Menu" trailing={<Icon name="ArrowRight2" />} clickable>
            Medium row (default)
          </ListItem>
          <ListItem size="lg" icon="Menu" trailing={<Icon name="ArrowRight2" />} clickable>
            Large row
          </ListItem>
        </List>
      </Block>

      <Block label="colored selection">
        <Col gap={16} style={{ maxWidth: 420 }}>
          <List>
            <ListItem icon="TaskSquare" color="medium" selected clickable>
              Selected (medium)
            </ListItem>
            <ListItem icon="TaskSquare" color="success" selected clickable>
              Selected (success)
            </ListItem>
          </List>
        </Col>
      </Block>
    </Section>
  )
}
