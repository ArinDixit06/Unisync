declare module "dompurify" {
  interface Config {
    USE_PROFILES?: {
      html?: boolean
    }
    ADD_TAGS?: string[]
    ADD_ATTR?: string[]
  }

  interface DOMPurifyI {
    sanitize(dirty: string, config?: Config): string
  }

  const DOMPurify: DOMPurifyI
  export default DOMPurify
}
