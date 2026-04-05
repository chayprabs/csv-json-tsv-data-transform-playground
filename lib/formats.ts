export const DATA_FORMAT_IDS = [
  "csv",
  "tsv",
  "json",
  "ndjson",
  "dkvp",
] as const;

export type DataFormatId = (typeof DATA_FORMAT_IDS)[number];

export interface DataFormat {
  id: DataFormatId;
  label: string;
  extension: string;
  inputFlag: string;
  outputFlag: string;
  mimeType: string;
}

export const FORMAT_OPTIONS = [
  {
    id: "csv",
    label: "CSV",
    extension: "csv",
    inputFlag: "--icsv",
    outputFlag: "--ocsv",
    mimeType: "text/csv",
  },
  {
    id: "tsv",
    label: "TSV",
    extension: "tsv",
    inputFlag: "--itsv",
    outputFlag: "--otsv",
    mimeType: "text/tab-separated-values",
  },
  {
    id: "json",
    label: "JSON",
    extension: "json",
    inputFlag: "--ijson",
    outputFlag: "--ojson",
    mimeType: "application/json",
  },
  {
    id: "ndjson",
    label: "NDJSON (JSON Lines)",
    extension: "ndjson",
    inputFlag: "--ijsonl",
    outputFlag: "--ojsonl",
    mimeType: "application/x-ndjson",
  },
  {
    id: "dkvp",
    label: "DKVP",
    extension: "dkvp",
    inputFlag: "--idkvp",
    outputFlag: "--odkvp",
    mimeType: "text/plain",
  },
 ] satisfies ReadonlyArray<DataFormat>;

const SUPPORTED_FORMAT_IDS = new Set<DataFormatId>(DATA_FORMAT_IDS);

export function isDataFormatId(value: string): value is DataFormatId {
  return SUPPORTED_FORMAT_IDS.has(value as DataFormatId);
}

export function getFormatById(id: DataFormatId): DataFormat {
  const format = FORMAT_OPTIONS.find((candidate) => candidate.id === id);

  if (!format) {
    throw new Error(`Unsupported data format: ${id}`);
  }

  return format;
}
