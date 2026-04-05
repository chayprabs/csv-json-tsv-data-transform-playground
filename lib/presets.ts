import type { DataFormatId } from "@/lib/formats";

export interface ExamplePreset {
  id: string;
  label: string;
  description: string;
  input: string;
  command: string;
  inputFormat: DataFormatId;
  outputFormat: DataFormatId;
}

export const SAMPLE_DATASET = `name,age,dept,salary,score
Alice,32,Engineering,95000,91
Bob,28,Marketing,72000,88
Carol,35,Engineering,105000,94
Dave,28,Marketing,68000,76
Eve,40,Engineering,120000,98
Frank,,Operations,64000,72
Grace,29,Sales,81000,
`;

export const EXAMPLE_PRESETS: ExamplePreset[] = [
  {
    id: "filter-threshold",
    label: "Filter rows where value > threshold",
    description:
      "Keeps only the rows whose numeric value clears the row-level threshold.",
    input: `name,value,threshold
alpha,12,10
beta,8,10
gamma,19,15
delta,7,6
epsilon,5,9
`,
    command: "filter '$value > $threshold'",
    inputFormat: "csv",
    outputFormat: "csv",
  },
  {
    id: "rename-reorder",
    label: "Rename and reorder columns",
    description:
      "Renames salary to compensation and rearranges the columns for reporting.",
    input: SAMPLE_DATASET,
    command:
      "rename salary,compensation then reorder -f dept,name,compensation,age,score",
    inputFormat: "csv",
    outputFormat: "csv",
  },
  {
    id: "csv-to-json",
    label: "CSV to JSON conversion",
    description: "Uses a pass-through operation to convert rows into JSON.",
    input: SAMPLE_DATASET,
    command: "cat",
    inputFormat: "csv",
    outputFormat: "json",
  },
  {
    id: "stats1",
    label: "Compute column statistics",
    description:
      "Calculates the mean, min, and max salary grouped by department.",
    input: SAMPLE_DATASET,
    command: "stats1 -a mean,min,max -f salary -g dept",
    inputFormat: "csv",
    outputFormat: "csv",
  },
  {
    id: "reshape-wide-to-long",
    label: "Pivot / reshape wide to long",
    description: "Turns quarterly columns into key/value rows.",
    input: `dept,q1,q2,q3
Engineering,120,133,141
Marketing,94,101,109
Sales,110,116,123
`,
    command: "reshape -i q1,q2,q3 -o quarter,value",
    inputFormat: "csv",
    outputFormat: "csv",
  },
  {
    id: "uniq-deduplicate",
    label: "Deduplicate rows",
    description: "Collapses repeated records down to a single row by email.",
    input: `email,team,active
alice@example.com,Engineering,true
bob@example.com,Marketing,true
alice@example.com,Engineering,true
carol@example.com,Engineering,false
bob@example.com,Marketing,true
`,
    command: "uniq -f email",
    inputFormat: "csv",
    outputFormat: "csv",
  },
];

export const DEFAULT_EXAMPLE_PRESET: ExamplePreset = EXAMPLE_PRESETS[0] ?? {
  id: "empty-default",
  label: "Empty workspace",
  description: "Start from a blank custom workspace.",
  input: "",
  command: "",
  inputFormat: "csv",
  outputFormat: "csv",
};
