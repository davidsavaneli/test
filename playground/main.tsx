import { StrictMode, type CSSProperties, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  Button,
  Icon,
  IconButton,
  Loader,
  ThemeProvider,
  ThemeToggle,
  Typography,
  type ThemeConfig,
} from "../src";
import "../src/styles/reset.css";
import "../src/styles/theme.css";
import "../src/styles/general.css";

const themeConfig: ThemeConfig = {
  mode: "light",
  colors: {
    light: {
      primary: "#13404e",
      secondary: "#f4f9f8",
      tertiary: "#5c7687",
      dark: "#056472",
      medium: "#039aa1",
      light: "#adc3c9",
      success: "#00a854",
      error: "#f04134",
      info: "#039aa1",
      warning: "#ffbf00",
    },
    dark: {
      secondary: "#04202b",
    },
  },
};

const VARIANTS = ["contained", "filled", "outlined", "text"] as const;
const COLORS = [
  "primary",
  "secondary",
  "tertiary",
  "dark",
  "medium",
  "light",
  "success",
  "error",
  "info",
  "warning",
] as const;
const SIZES = ["sm", "md", "lg"] as const;
const TYPO_VARIANTS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "subtitle",
  "body",
  "bodySmall",
  "caption",
  "uppercase",
] as const;

const rowStyle: CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
};

/** Capitalize the first letter — for human-readable demo labels (e.g. `primary` -> `Primary`). */
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Top-level component group (Button, Loader). */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 20,
          paddingBottom: 8,
          borderBottom: "1px solid var(--tz-color-border)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Labeled sub-group inside a Section. */
function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function ButtonSection() {
  return (
    <Section title="Button">
      <Block label="variants × colors">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {VARIANTS.map((v) => (
            <div
              key={v}
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <code style={{ fontSize: 11 }}>{v}</code>
              <div style={rowStyle}>
                {COLORS.map((c) => (
                  <Button key={c} variant={v} color={c}>
                    {cap(c)}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block label="sizes">
        <div style={rowStyle}>
          {SIZES.map((s) => (
            <Button key={s} size={s}>
              Size {s.toUpperCase()}
            </Button>
          ))}
        </div>
      </Block>

      <Block label="with icons">
        <div style={rowStyle}>
          <Button startIcon={<Icon name="Add" />}>Start Icon</Button>
          <Button endIcon={<Icon name="ArrowRight2" />}>End Icon</Button>
          <Button
            startIcon={<Icon name="Setting2" />}
            endIcon={<Icon name="ArrowRight2" />}
          >
            Both
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<Icon name="Trash" />}
          >
            Delete
          </Button>
          <Button
            variant="filled"
            color="success"
            startIcon={<Icon name="TickCircle" />}
          >
            Save
          </Button>
        </div>
      </Block>

      <Block label="states">
        <div style={rowStyle}>
          <Button loading>Loading</Button>
          <Button loading startIcon={<Icon name="Add" />}>
            Loading + Start Icon
          </Button>
          <Button loading endIcon={<Icon name="ArrowRight2" />}>
            Loading + End Icon
          </Button>
          <Button disabled>Disabled</Button>
          <Button variant="outlined" disabled>
            Disabled
          </Button>
          <Button rounded>Rounded</Button>
          <Button variant="filled" color="success" rounded>
            Rounded
          </Button>
        </div>
        <div style={rowStyle}>
          {SIZES.map((s) => (
            <Button key={s} size={s} loading startIcon={<Icon name="Add" />}>
              Loading {s.toUpperCase()}
            </Button>
          ))}
        </div>
        <Button fullWidth>Full Width</Button>
      </Block>
    </Section>
  );
}

function IconButtonSection() {
  return (
    <Section title="IconButton">
      <Block label="variants × colors">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {VARIANTS.map((v) => (
            <div
              key={v}
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <code style={{ fontSize: 11 }}>{v}</code>
              <div style={rowStyle}>
                {COLORS.map((c) => (
                  <IconButton key={c} variant={v} color={c} aria-label={c}>
                    <Icon name="Setting2" />
                  </IconButton>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block label="sizes">
        <div style={rowStyle}>
          {SIZES.map((s) => (
            <IconButton key={s} size={s} aria-label={`size ${s}`}>
              <Icon name="Add" />
            </IconButton>
          ))}
        </div>
      </Block>

      <Block label="states">
        <div style={rowStyle}>
          <IconButton loading aria-label="loading">
            <Icon name="Add" />
          </IconButton>
          <IconButton disabled aria-label="disabled">
            <Icon name="Add" />
          </IconButton>
          <IconButton variant="outlined" disabled aria-label="disabled">
            <Icon name="Add" />
          </IconButton>
          <IconButton rounded aria-label="rounded">
            <Icon name="Add" />
          </IconButton>
          <IconButton
            variant="filled"
            color="error"
            rounded
            aria-label="delete"
          >
            <Icon name="Trash" />
          </IconButton>
        </div>
        <div style={rowStyle}>
          {SIZES.map((s) => (
            <IconButton key={s} size={s} loading aria-label={`loading ${s}`}>
              <Icon name="Add" />
            </IconButton>
          ))}
        </div>
        <IconButton color="error" nonClickable>
          <Icon name="Add" />
        </IconButton>
      </Block>
    </Section>
  );
}

function LoaderSection() {
  return (
    <Section title="Loader">
      <Block label="sizes">
        <div style={{ ...rowStyle, gap: 28 }}>
          {SIZES.map((s) => (
            <Loader key={s} size={s} />
          ))}
        </div>
      </Block>

      <Block label="colors">
        <div style={{ ...rowStyle, gap: 28 }}>
          {COLORS.map((c) => (
            <Loader key={c} color={c} size="lg" />
          ))}
        </div>
      </Block>

      <Block label="inherits text color (currentColor)">
        <div style={rowStyle}>
          {(["primary", "success", "error", "warning", "info"] as const).map(
            (c) => (
              <div
                key={c}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  backgroundColor: `var(--tz-color-${c})`,
                  color: "#fff",
                }}
              >
                <Loader size="lg" />
              </div>
            ),
          )}
        </div>
      </Block>
    </Section>
  );
}

function TypographySection() {
  return (
    <Section title="Typography">
      <Block label="variants">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {TYPO_VARIANTS.map((v) => (
            <div
              key={v}
              style={{ display: "flex", alignItems: "baseline", gap: 16 }}
            >
              <code style={{ fontSize: 11, width: 80, flexShrink: 0 }}>
                {v}
              </code>
              <Typography variant={v}>The quick brown fox</Typography>
            </div>
          ))}
        </div>
      </Block>

      <Block label="colors">
        <div style={rowStyle}>
          <Typography>Text (default)</Typography>
          {COLORS.map((c) => (
            <Typography key={c} color={c}>
              {cap(c)}
            </Typography>
          ))}
        </div>
      </Block>

      <Block label="align">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            width: "100%",
          }}
        >
          <Typography align="left">Left Aligned</Typography>
          <Typography align="center">Center Aligned</Typography>
          <Typography align="right">Right Aligned</Typography>
        </div>
      </Block>

      <Block label="modifiers">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            maxWidth: 280,
          }}
        >
          <Typography truncate>
            Truncate — this is a very long single line that will be clipped with
            an ellipsis
          </Typography>
          <Typography as="span" variant="h3">
            as=&quot;span&quot; (h3 styling, span tag)
          </Typography>
        </div>
      </Block>
    </Section>
  );
}

function Demo() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 40,
        maxWidth: 880,
        margin: "0 auto",
      }}
    >
      <header style={{ display: "flex", justifyContent: "flex-end" }}>
        <ThemeToggle />
      </header>

      <TypographySection />
      <ButtonSection />
      <IconButtonSection />
      <LoaderSection />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider config={themeConfig}>
      <Demo />
    </ThemeProvider>
  </StrictMode>,
);
