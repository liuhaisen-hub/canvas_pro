interface ImportMetaEnv {
  DISPATH: string
  TARGET: string
  BUNNDLE: string
  MINIFY: string
  SCROUPMAP: string
  [key: string]: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
