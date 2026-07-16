import { Badge, Button, Icon, IconButton, Row } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

export function BadgeSection() {
  return (
    <Section>
      <Block label="sizes (sm · md · lg)">
        <Row gap={24} wrap>
          {SIZES.map((s) => (
            <Badge key={s} content={2}>
              <Button size={s}>Size {s.toUpperCase()}</Button>
            </Badge>
          ))}
        </Row>
        <Row gap={24} wrap>
          {SIZES.map((s) => (
            <Badge key={s} content={8} color="error">
              <IconButton size={s} variant="filled" aria-label={`size ${s}`}>
                <Icon name="Notification" />
              </IconButton>
            </Badge>
          ))}
          {SIZES.map((s) => (
            <Badge key={`dot-${s}`} dot color="success">
              <IconButton size={s} variant="filled" aria-label={`dot ${s}`}>
                <Icon name="Notification" />
              </IconButton>
            </Badge>
          ))}
        </Row>
      </Block>

      <Block label="on Button & IconButton — number / dot">
        <Row gap={24} wrap>
          <Badge content={2}>
            <IconButton variant="filled" aria-label="Filters">
              <Icon name="Filter" />
            </IconButton>
          </Badge>
          <Badge dot color="success">
            <IconButton variant="filled" aria-label="Messages">
              <Icon name="Notification" />
            </IconButton>
          </Badge>
          <Badge content={2}>
            <Button>Button</Button>
          </Badge>
          <Badge content={128} color="error">
            <Button variant="outlined">Inbox</Button>
          </Badge>
        </Row>
      </Block>

      <Block label="colors">
        <Row gap={24} wrap>
          {(['primary', 'success', 'error', 'warning', 'info'] as const).map((c) => (
            <Badge key={c} content={3} color={c}>
              <IconButton variant="filled" color={c} aria-label={c}>
                <Icon name="Notification" />
              </IconButton>
            </Badge>
          ))}
        </Row>
      </Block>

      <Block label="max (99+) · showZero · placements">
        <Row gap={24} wrap>
          <Badge content={1000}>
            <Button>Max 99+</Button>
          </Badge>
          <Badge content={0} showZero color="info">
            <Button variant="outlined">Show Zero</Button>
          </Badge>
          <Badge content={5} placement="top-left">
            <Button variant="filled">Top Left</Button>
          </Badge>
          <Badge content="new" color="brand">
            <Button variant="filled">Text</Button>
          </Badge>
        </Row>
      </Block>
    </Section>
  )
}
