declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

// Plain stylesheets imported for their side effects (global resets, theme tokens).
declare module '*.css'
