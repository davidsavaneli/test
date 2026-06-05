import { useState } from 'react'
import { Avatar, Chip, Icon } from '../../../src'
import { Block, COLORS, rowStyle, Section, SIZES, VARIANTS } from '../../shared'

export function ChipSection() {
  const [tags, setTags] = useState(['Design', 'Engineering', 'Product', 'Marketing'])

  return (
    <Section>
      <Block label="variants">
        <div style={rowStyle}>
          {VARIANTS.map((v) => (
            <Chip key={v} variant={v}>
              {v}
            </Chip>
          ))}
        </div>
      </Block>

      <Block label="colors (filled)">
        <div style={rowStyle}>
          {COLORS.map((c) => (
            <Chip key={c} color={c}>
              {c}
            </Chip>
          ))}
        </div>
      </Block>

      <Block label="with icon · avatar · delete">
        <div style={rowStyle}>
          <Chip startIcon={<Icon name="TickCircle" />} color="success">
            Verified
          </Chip>
          <Chip variant="outlined" startIcon={<Icon name="Clock" />}>
            Pending
          </Chip>
          <Chip avatar={<Avatar name="David Savaneli" />}>David Savaneli</Chip>
          <Chip
            avatar={<Avatar src="https://i.pravatar.cc/80?img=14" name="User" />}
            variant="outlined"
          >
            Mariam
          </Chip>
          <Chip onDelete={() => alert('deleted')}>Removable</Chip>
        </div>
      </Block>

      <Block label="clickable · disabled">
        <div style={rowStyle}>
          <Chip clickable onClick={() => alert('Chip clicked')}>
            Clickable
          </Chip>
          <Chip clickable variant="contained" color="medium" onClick={() => alert('Filter')}>
            Filter
          </Chip>
          <Chip disabled>Disabled</Chip>
          <Chip clickable disabled onDelete={() => {}}>
            Disabled
          </Chip>
        </div>
      </Block>

      <Block label="removable set (click ✕ to remove)">
        <div style={rowStyle}>
          {tags.map((t) => (
            <Chip
              key={t}
              variant="outlined"
              avatar={<Avatar name={t} />}
              onDelete={() => setTags((prev) => prev.filter((x) => x !== t))}
            >
              {t}
            </Chip>
          ))}
          {tags.length === 0 && (
            <Chip variant="text" clickable onClick={() => setTags(['Design', 'Engineering'])}>
              Reset
            </Chip>
          )}
        </div>
      </Block>

      <Block label="sizes (sm · md · lg)">
        <div style={rowStyle}>
          {SIZES.map((s) => (
            <Chip key={s} size={s} avatar={<Avatar name="D S" />} onDelete={() => {}}>
              Size {s.toUpperCase()}
            </Chip>
          ))}
        </div>
      </Block>
    </Section>
  )
}
