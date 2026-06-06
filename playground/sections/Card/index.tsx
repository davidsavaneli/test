import { Button, Card, Col, Grid, Icon, IconButton, Tooltip, Typography } from '../../../src'
import { Block, Section } from '../../shared'

export function CardSection() {
  return (
    <Section>
      <Block label="basic — icon · title · subtitle · body">
        <Card
          icon="Setting2"
          title="Settings"
          subtitle="Manage your workspace preferences"
          style={{ maxWidth: 420 }}
        >
          <Typography color="tertiary">
            A simple surface card with an icon, a title, a subtitle, and body content.
          </Typography>
        </Card>
      </Block>

      <Block label="icon color + long title (clamps to two lines)">
        <Grid minItemWidth={260} gap={16} align="start">
          <Card icon="Wallet3" color="success" title="Revenue">
            <Typography color="tertiary" variant="bodySmall">
              Pass a color to tint the leading icon box.
            </Typography>
          </Card>
          <Card
            icon="InfoCircle"
            color="warning"
            title="A Long Card Title That Keeps Going And Wraps To At Most Two Lines Before It Truncates"
          >
            <Typography color="tertiary" variant="bodySmall">
              The title clamps to two lines, then an ellipsis.
            </Typography>
          </Card>
        </Grid>
      </Block>

      <Block label="header actions + footer actions">
        <Card
          icon="Profile"
          title="Team Member"
          style={{ maxWidth: 420 }}
          actions={
            <>
              <Tooltip content="Edit">
                <IconButton variant="filled" size="sm" aria-label="Edit">
                  <Icon name="Edit2" />
                </IconButton>
              </Tooltip>
              <Tooltip content="Delete">
                <IconButton variant="filled" size="sm" color="error" aria-label="Delete">
                  <Icon name="Trash" />
                </IconButton>
              </Tooltip>
            </>
          }
          footerStart={
            <Tooltip content="More options">
              <IconButton variant="filled" size="sm" aria-label="More options">
                <Icon name="More" />
              </IconButton>
            </Tooltip>
          }
          footer={
            <>
              <Button variant="text" size="sm">
                Cancel
              </Button>
              <Button size="sm">Save</Button>
            </>
          }
        >
          <Col gap={4}>
            <Typography>David Savaneli</Typography>
            <Typography variant="bodySmall" color="tertiary">
              david@techzy.app · Admin
            </Typography>
          </Col>
        </Card>
      </Block>

      <Block label="collapsible (click the chevron)">
        <Card
          icon="Notification"
          title="Notifications"
          collapsible
          style={{ maxWidth: 420 }}
          actions={
            <Tooltip content="Settings">
              <IconButton variant="filled" size="sm" aria-label="Notification settings">
                <Icon name="Setting2" />
              </IconButton>
            </Tooltip>
          }
          footer={<Button size="sm">Mark all read</Button>}
        >
          <Col gap={8}>
            <Typography>You have 3 new messages.</Typography>
            <Typography variant="bodySmall" color="tertiary">
              The body and footer fold away smoothly when collapsed.
            </Typography>
          </Col>
        </Card>
      </Block>

      <Block label="collapsed by default · a grid of cards">
        <Grid minItemWidth={240} gap={16} align="start">
          <Card title="Revenue" icon="Chart" collapsible defaultCollapsed>
            <Typography variant="h3">$12,480</Typography>
          </Card>
          <Card title="Orders" icon="Box" collapsible>
            <Typography variant="h3">1,204</Typography>
          </Card>
        </Grid>
      </Block>
    </Section>
  )
}
