import { Avatar, AvatarGroup, Icon } from '../../../src'
import { Block, COLORS, rowStyle, Section, SIZES } from '../../shared'

const FACE = (n: number) => `https://i.pravatar.cc/120?img=${n}`

export function AvatarSection() {
  return (
    <Section>
      <Block label="image · icon · initials · default">
        <div style={{ ...rowStyle, gap: 16 }}>
          <Avatar src={FACE(12)} name="David Savaneli" />
          <Avatar icon={<Icon name="User" />} color="medium" />
          <Avatar name="David Savaneli">D.S.</Avatar>
          <Avatar name="Mariam Kapanadze" />
          <Avatar />
        </div>
      </Block>

      <Block label="sizes (sm · md · lg)">
        <div style={{ ...rowStyle, gap: 16 }}>
          {SIZES.map((s) => (
            <Avatar key={s} size={s} name="David Savaneli" />
          ))}
          {SIZES.map((s) => (
            <Avatar key={`img-${s}`} size={s} src={FACE(5)} name="Avatar" />
          ))}
        </div>
      </Block>

      <Block label="shapes · colors">
        <div style={{ ...rowStyle, gap: 16 }}>
          <Avatar shape="square" name="Techzy UI">
            TU
          </Avatar>
          {COLORS.slice(0, 6).map((c) => (
            <Avatar key={c} color={c} name="David Savaneli" />
          ))}
        </div>
      </Block>

      <Block label="AvatarGroup — overlap + “+N” overflow">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <AvatarGroup max={3}>
            <Avatar src={FACE(11)} name="One" />
            <Avatar src={FACE(13)} name="Two" />
            <Avatar src={FACE(15)} name="Three" />
            <Avatar src={FACE(20)} name="Four" />
          </AvatarGroup>
          <AvatarGroup max={4} size="lg">
            <Avatar name="Ann Lee" />
            <Avatar name="Bo Cox" color="medium" />
            <Avatar name="Cy Day" color="success" />
            <Avatar name="Di Fox" color="error" />
            <Avatar name="Ed Guy" color="warning" />
            <Avatar name="Fi Hue" color="info" />
          </AvatarGroup>
        </div>
      </Block>
    </Section>
  )
}
