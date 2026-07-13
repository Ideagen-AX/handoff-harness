// html-to-docx ships no types; minimal declaration for our usage.
declare module "html-to-docx" {
  const HTMLtoDOCX: (
    htmlString: string,
    headerHTMLString?: string | null,
    documentOptions?: Record<string, unknown>,
    footerHTMLString?: string | null,
  ) => Promise<Buffer | ArrayBuffer | Blob>;
  export default HTMLtoDOCX;
}
