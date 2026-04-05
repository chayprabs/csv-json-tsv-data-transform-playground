import { getUnsupportedOperationReason } from "@/lib/commandPolicy";

export interface OperationDefinition {
  name: string;
  description: string;
  example: string;
  insertText: string;
  isSupported: boolean;
  supportNote: string | null;
}

const allOperationNames = [
  "altkv",
  "bar",
  "bootstrap",
  "case",
  "cat",
  "check",
  "clean-whitespace",
  "count",
  "count-distinct",
  "count-similar",
  "cut",
  "decimate",
  "fill-down",
  "fill-empty",
  "filter",
  "flatten",
  "format-values",
  "fraction",
  "gap",
  "grep",
  "group-by",
  "group-like",
  "gsub",
  "having-fields",
  "head",
  "histogram",
  "join",
  "json-parse",
  "json-stringify",
  "label",
  "latin1-to-utf8",
  "least-frequent",
  "merge-fields",
  "most-frequent",
  "nest",
  "nothing",
  "put",
  "regularize",
  "remove-empty-columns",
  "rename",
  "reorder",
  "repeat",
  "reshape",
  "sample",
  "sec2gmt",
  "sec2gmtdate",
  "seqgen",
  "shuffle",
  "skip-trivial-records",
  "sort",
  "sort-within-records",
  "sparsify",
  "split",
  "ssub",
  "stats1",
  "stats2",
  "step",
  "sub",
  "summary",
  "surv",
  "tac",
  "tail",
  "tee",
  "template",
  "top",
  "unflatten",
  "uniq",
  "unspace",
  "unsparsify",
  "utf8-to-latin1",
] as const;

const curatedOperationContent: Record<
  string,
  Omit<OperationDefinition, "name" | "isSupported" | "supportNote">
> = {
  cat: {
    description:
      "Passes records through unchanged, which makes it handy for quick format conversion.",
    example: "cat",
    insertText: "cat",
  },
  cut: {
    description: "Keeps or removes selected fields by name.",
    example: "cut -f name,salary",
    insertText: "cut -f name,salary",
  },
  filter: {
    description:
      "Emits only the records whose expression evaluates to true.",
    example: "filter '$age > 30'",
    insertText: "filter '$age > 30'",
  },
  head: {
    description: "Shows only the first N records.",
    example: "head -n 5",
    insertText: "head -n 5",
  },
  tail: {
    description: "Shows only the last N records.",
    example: "tail -n 5",
    insertText: "tail -n 5",
  },
  sort: {
    description:
      "Sorts records lexically or numerically by one or more fields.",
    example: "sort -nr salary",
    insertText: "sort -nr salary",
  },
  rename: {
    description: "Renames one or more fields without changing their values.",
    example: "rename salary,compensation",
    insertText: "rename salary,compensation",
  },
  reorder: {
    description: "Rearranges field order to make output easier to read or export.",
    example: "reorder -f dept,name,salary",
    insertText: "reorder -f dept,name,salary",
  },
  uniq: {
    description: "Deduplicates repeated records, optionally by selected keys.",
    example: "uniq -f age",
    insertText: "uniq -f age",
  },
  count: {
    description: "Counts records, with optional grouping.",
    example: "count -g dept",
    insertText: "count -g dept",
  },
  "count-distinct": {
    description: "Counts the number of distinct values for the requested fields.",
    example: "count-distinct -f dept",
    insertText: "count-distinct -f dept",
  },
  stats1: {
    description: "Computes one-variable statistics such as mean, min, and max.",
    example: "stats1 -a mean,min,max -f salary -g dept",
    insertText: "stats1 -a mean,min,max -f salary -g dept",
  },
  stats2: {
    description:
      "Computes paired statistics such as covariance and correlation.",
    example: "stats2 -a corr -f x,y",
    insertText: "stats2 -a corr -f x,y",
  },
  histogram: {
    description: "Buckets numeric values so you can inspect their distribution.",
    example: "histogram -f salary --lo 60000 --hi 130000 --nbins 5",
    insertText: "histogram -f salary --lo 60000 --hi 130000 --nbins 5",
  },
  reshape: {
    description: "Pivots wide data to long form, or reverses the operation.",
    example: "reshape -i q1,q2,q3 -o quarter,value",
    insertText: "reshape -i q1,q2,q3 -o quarter,value",
  },
  flatten: {
    description:
      "Flattens nested map or array structures into single-level fields.",
    example: "flatten",
    insertText: "flatten",
  },
  unflatten: {
    description: "Restores nested structures from flattened field names.",
    example: "unflatten",
    insertText: "unflatten",
  },
  join: {
    description: "Joins one record stream to another using key fields.",
    example: "join -j id -f lookup.csv",
    insertText: "join -j id -f lookup.csv",
  },
  tee: {
    description:
      "Copies a stream to a side output while continuing downstream processing.",
    example: "tee --ojson audit.json",
    insertText: "tee --ojson audit.json",
  },
  tac: {
    description: "Reverses the record order.",
    example: "tac",
    insertText: "tac",
  },
  label: {
    description: "Assigns field names to positional data.",
    example: "label name,age,dept",
    insertText: "label name,age,dept",
  },
  put: {
    description: "Creates or updates fields programmatically.",
    example: "put '$bonus = $salary * 0.1'",
    insertText: "put '$bonus = $salary * 0.1'",
  },
  step: {
    description:
      "Computes cumulative, lagged, and rolling calculations across records.",
    example: "step -a delta,sum -f salary -g dept",
    insertText: "step -a delta,sum -f salary -g dept",
  },
  "format-values": {
    description: "Formats field values with printf-style templates.",
    example: "format-values -f salary -s '%.2f'",
    insertText: "format-values -f salary -s '%.2f'",
  },
  "fill-down": {
    description: "Carries the last non-empty value forward through later rows.",
    example: "fill-down -f dept",
    insertText: "fill-down -f dept",
  },
  "fill-empty": {
    description: "Replaces empty values with a default literal.",
    example: "fill-empty -v unknown -f dept",
    insertText: "fill-empty -v unknown -f dept",
  },
  "skip-trivial-records": {
    description: "Drops blank or otherwise trivial records from the stream.",
    example: "skip-trivial-records",
    insertText: "skip-trivial-records",
  },
  "json-parse": {
    description:
      "Parses JSON strings stored inside fields into structured values.",
    example: "json-parse -f payload",
    insertText: "json-parse -f payload",
  },
  "json-stringify": {
    description: "Serializes nested values back into JSON strings.",
    example: "json-stringify -f payload",
    insertText: "json-stringify -f payload",
  },
};

export const OPERATIONS: OperationDefinition[] = allOperationNames
  .map((name) => {
    const curated = curatedOperationContent[name];
    const supportNote = getUnsupportedOperationReason(name);

    if (curated) {
      return {
        name,
        ...curated,
        isSupported: supportNote === null,
        supportNote,
      };
    }

    return {
      name,
      description: `Runs the ${name} operation for record or field transformation.`,
      example: `${name} --help`,
      insertText: name,
      isSupported: supportNote === null,
      supportNote,
    };
  })
  .sort((left, right) => left.name.localeCompare(right.name));
