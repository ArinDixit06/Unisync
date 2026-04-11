declare module "quoted-printable" {
  const quotedPrintable: {
    decode(input: string): string
  }
  export default quotedPrintable
}
