import { useState } from 'react'
import {
  Avatar,
  Button,
  Col,
  Divider,
  Dropdown,
  Icon,
  IconButton,
  ListItem,
  Row,
  Typography,
} from '../../../src'
import { Block, Section } from '../../shared'

export function DropdownSection() {
  const [sort, setSort] = useState('Newest')

  return (
    <Section>
      <Block label="button trigger — actions menu (icons · divider · destructive)">
        <Row>
          <Dropdown trigger={<Button endIcon={<Icon name="ArrowDown2" />}>Actions</Button>}>
            <ListItem icon="Edit2" clickable>
              Edit
            </ListItem>
            <ListItem icon="Copy" clickable>
              Duplicate
            </ListItem>
            <ListItem icon="Share" clickable>
              Share
            </ListItem>
            <Divider />
            <ListItem icon={<Icon name="Trash" color="error" />} clickable>
              Delete
            </ListItem>
          </Dropdown>
        </Row>
      </Block>

      <Block label="icon button trigger — row actions (⋮)">
        <Row>
          <Dropdown
            placement="bottom-end"
            trigger={
              <IconButton variant="text" aria-label="Row actions">
                <Icon name="More" />
              </IconButton>
            }
          >
            <ListItem icon="Eye" clickable>
              View
            </ListItem>
            <ListItem icon="Edit2" clickable>
              Rename
            </ListItem>
            <ListItem icon="Archive" clickable>
              Archive
            </ListItem>
          </Dropdown>
        </Row>
      </Block>

      <Block label="avatar / user menu (with a header)">
        <Row>
          <Dropdown
            placement="bottom-end"
            trigger={
              <Button variant="text">
                <Row gap={8} align="center">
                  <Avatar size="sm" name="David Savaneli" />
                  David
                  <Icon name="ArrowDown2" />
                </Row>
              </Button>
            }
          >
            <Row gap={8} align="center" padding="8px 12px">
              <Avatar size="sm" name="David Savaneli" />
              <Col gap={2}>
                <Typography variant="bodySmall">David Savaneli</Typography>
                <Typography variant="caption" color="muted">
                  david@techzy.app
                </Typography>
              </Col>
            </Row>
            <Divider />
            <ListItem icon="User" clickable>
              Profile
            </ListItem>
            <ListItem icon="Setting2" clickable>
              Settings
            </ListItem>
            <Divider />
            <ListItem icon={<Icon name="Logout" color="error" />} clickable>
              Sign out
            </ListItem>
          </Dropdown>
        </Row>
      </Block>

      <Block label="select-like — matchTriggerWidth + selected state">
        <Row>
          <Dropdown
            matchTriggerWidth
            trigger={
              <Button
                variant="outlined"
                endIcon={<Icon name="ArrowDown2" />}
                style={{ width: 220 }}
              >
                Sort: {sort}
              </Button>
            }
          >
            {['Newest', 'Oldest', 'Name A–Z', 'Name Z–A'].map((option) => (
              <ListItem
                key={option}
                clickable
                selected={sort === option}
                onClick={() => setSort(option)}
              >
                {option}
              </ListItem>
            ))}
          </Dropdown>
        </Row>
      </Block>

      <Block label="placement — bottom-start · bottom-end · top-start · top-end">
        <Row gap={12} wrap>
          {(['bottom-start', 'bottom-end', 'top-start', 'top-end'] as const).map((placement) => (
            <Dropdown
              key={placement}
              placement={placement}
              trigger={<Button variant="filled">{placement}</Button>}
            >
              <ListItem icon="ArrowUp3" clickable>
                One
              </ListItem>
              <ListItem icon="ArrowDown2" clickable>
                Two
              </ListItem>
              <ListItem icon="ArrowRight2" clickable>
                Three
              </ListItem>
            </Dropdown>
          ))}
        </Row>
      </Block>

      <Block label="sizes — sm · md · lg (min-width 150 · 190 · 220 + item density)">
        <Row gap={12} wrap>
          {(['sm', 'md', 'lg'] as const).map((size) => (
            <Dropdown
              key={size}
              size={size}
              trigger={<Button variant="outlined">{size.toUpperCase()}</Button>}
            >
              <ListItem icon="User" clickable>
                Profile
              </ListItem>
              <ListItem icon="Setting2" clickable>
                Settings
              </ListItem>
              <ListItem icon={<Icon name="Logout" color="error" />} clickable>
                Sign out
              </ListItem>
            </Dropdown>
          ))}
        </Row>
      </Block>

      <Block label="minWidth={false} — sizes to content (no size min-width)">
        <Row gap={12} wrap>
          <Dropdown trigger={<Button variant="outlined">Default (md min-width)</Button>}>
            <ListItem icon="Eye" clickable>
              View
            </ListItem>
            <ListItem icon="Edit2" clickable>
              Edit
            </ListItem>
          </Dropdown>
          <Dropdown minWidth={false} trigger={<Button variant="outlined">minWidth false</Button>}>
            <ListItem icon="Eye" clickable>
              View
            </ListItem>
            <ListItem icon="Edit2" clickable>
              Edit
            </ListItem>
          </Dropdown>
        </Row>
      </Block>

      <Block label="tall menu — caps height + scrolls, never leaves the screen">
        <Row>
          <Dropdown trigger={<Button variant="outlined">Pick a country</Button>}>
            {COUNTRIES.map((country) => (
              <ListItem key={country} icon="Global" clickable>
                {country}
              </ListItem>
            ))}
          </Dropdown>
        </Row>
      </Block>

      <Block label="edge case — trigger near the bottom flips upward automatically">
        <Typography variant="bodySmall" color="muted">
          The button below sits low on the page; opening it positions the menu above when there
          isn’t room beneath.
        </Typography>
        <div style={{ height: '70vh' }} />
        <Row>
          <Dropdown trigger={<Button>Open near the bottom</Button>}>
            <ListItem icon="Edit2" clickable>
              Edit
            </ListItem>
            <ListItem icon="Copy" clickable>
              Duplicate
            </ListItem>
            <ListItem icon="Setting2" clickable>
              Settings
            </ListItem>
          </Dropdown>
        </Row>
      </Block>
    </Section>
  )
}

const COUNTRIES = [
  'Argentina',
  'Australia',
  'Brazil',
  'Canada',
  'Denmark',
  'Egypt',
  'France',
  'Georgia',
  'Germany',
  'India',
  'Italy',
  'Japan',
  'Kenya',
  'Mexico',
  'Netherlands',
  'Norway',
  'Poland',
  'Portugal',
  'Spain',
  'Sweden',
  'Turkey',
  'Ukraine',
  'United Kingdom',
  'United States',
]
