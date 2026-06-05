import { Divider, Typography } from '../../../src'
import { Block, Section } from '../../shared'

export function DividerSection() {
  return (
    <Section>
      <Block label="plain">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Typography color="tertiary">Above the line</Typography>
          <Divider />
          <Typography color="tertiary">Below the line</Typography>
        </div>
      </Block>

      <Block label="with title — align left / center / right">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Divider align="left">Left</Divider>
          <Divider>Center (default)</Divider>
          <Divider align="right">Right</Divider>
        </div>
      </Block>

      <Block label="vertical (between items)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, height: 24 }}>
          <Typography>Profile</Typography>
          <Divider orientation="vertical" />
          <Typography>Settings</Typography>
          <Divider orientation="vertical" />
          <Typography>Logout</Typography>
        </div>
      </Block>
    </Section>
  )
}
