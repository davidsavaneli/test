import { Button, Card, Col, EmptyState, Icon, toast } from '../../../src'
import { Block, Section, SIZES } from '../../shared'

export function EmptyStateSection() {
  return (
    <Section>
      <Block label="Default">
        <Card>
          <EmptyState />
        </Card>
      </Block>

      <Block
        label="Pattern — the polished 'hero' look (faded grid + elevated icon)"
        description="pattern adds a grid backdrop that fades out + a floating icon puck."
      >
        <Card>
          <EmptyState
            pattern
            size="md"
            icon="FolderOpen"
            title="No Files Found"
            description="Your search “FX2025-26” did not match any files. Try a different term."
            action={
              <Button variant="outlined" onClick={() => toast.info('Search cleared')}>
                Clear Search
              </Button>
            }
          />
        </Card>
      </Block>

      <Block label="Default">
        <Card>
          <EmptyState />
        </Card>
      </Block>

      <Block
        label="With description + action — the common 'nothing yet' page"
        description="A muted glyph, a heading, a hint, and a primary action."
      >
        <Card>
          <EmptyState
            icon="People"
            title="No Users Yet"
            description="Invite your first teammate and they'll show up here."
            action={
              <Button startIcon={<Icon name="Add" />} onClick={() => toast.success('Invite sent')}>
                Add User
              </Button>
            }
          />
        </Card>
      </Block>

      <Block
        label="No search results — a different icon + a Clear action"
        description="Reuse it for empty filters/search, not just empty data."
      >
        <Card>
          <EmptyState
            icon="SearchNormal1"
            title="No Results"
            description="No items match your filters. Try broadening your search."
            action={
              <Button variant="outlined" onClick={() => toast.info('Filters cleared')}>
                Clear Filters
              </Button>
            }
          />
        </Card>
      </Block>

      <Block label="Sizes — sm / md / lg">
        <Col gap={16}>
          {SIZES.map((s) => (
            <Card key={s}>
              <EmptyState
                size={s}
                title={`Size ${s}`}
                description="Scales the icon, text, and padding."
              />
            </Card>
          ))}
        </Col>
      </Block>

      <Block label="Without an icon">
        <Card>
          <EmptyState icon={false} title="Nothing Here" description="A text-only empty state." />
        </Card>
      </Block>
    </Section>
  )
}
