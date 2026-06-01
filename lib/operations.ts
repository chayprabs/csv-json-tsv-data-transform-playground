import { getUnsupportedOperationReason } from "@/lib/commandPolicy";

export interface OperationDefinition {
  name: string;
  description: string;
  example: string;
  insertText: string;
  isSupported: boolean;
  supportNote: string | null;
}

/** PRD §7 — exactly 23 operations, in catalog order. */
const MILL_PRD_OPERATIONS: Omit<
  OperationDefinition,
  "isSupported" | "supportNote"
>[] = [
  {
    name: "cat",
    description: "Pass through all records unchanged",
    example: "cat",
    insertText: "cat",
  },
  {
    name: "cut",
    description: "Select or drop specific fields",
    example: "cut -f field1,field2",
    insertText: "cut -f field1,field2",
  },
  {
    name: "filter",
    description: "Keep records matching a condition",
    example: "filter '$age > 25'",
    insertText: "filter '$age > 25'",
  },
  {
    name: "head",
    description: "Take the first N records",
    example: "head -n 10",
    insertText: "head -n 10",
  },
  {
    name: "tail",
    description: "Take the last N records",
    example: "tail -n 10",
    insertText: "tail -n 10",
  },
  {
    name: "sort",
    description: "Sort by one or more fields",
    example: "sort -f name",
    insertText: "sort -f name",
  },
  {
    name: "rename",
    description: "Rename fields by old→new pairs",
    example: "rename old_name,new_name",
    insertText: "rename old_name,new_name",
  },
  {
    name: "reorder",
    description: "Reorder fields in output",
    example: "reorder -f field1,field2",
    insertText: "reorder -f field1,field2",
  },
  {
    name: "uniq",
    description: "Deduplicate records or field sets",
    example: "uniq -f field1",
    insertText: "uniq -f field1",
  },
  {
    name: "count-vals",
    description: "Count values per field (use count-distinct for unique counts)",
    example: "count-vals -f field1",
    insertText: "count-vals -f field1",
  },
  {
    name: "stats1",
    description:
      "Per-field summary statistics (mean, stddev, min, max)",
    example: "stats1 -a mean,stddev -f amount",
    insertText: "stats1 -a mean,stddev -f amount",
  },
  {
    name: "stats2",
    description: "Pairwise field correlations",
    example: "stats2 -a corr -f x,y",
    insertText: "stats2 -a corr -f x,y",
  },
  {
    name: "histogram",
    description: "Bucket a numeric field",
    example: "histogram -f amount --lo 0 --hi 100 --nbuckets 10",
    insertText: "histogram -f amount --lo 0 --hi 100 --nbuckets 10",
  },
  {
    name: "reshape",
    description: "Pivot wide↔long formats",
    example: "reshape -r \"^value_\" -o item,value",
    insertText: "reshape -r \"^value_\" -o item,value",
  },
  {
    name: "flatten",
    description: "Flatten nested JSON to dotted keys",
    example: "flatten",
    insertText: "flatten",
  },
  {
    name: "unflatten",
    description: "Restore dotted keys to nested JSON",
    example: "unflatten",
    insertText: "unflatten",
  },
  {
    name: "label",
    description: "Assign field names to unlabeled input",
    example: "label a,b,c",
    insertText: "label a,b,c",
  },
  {
    name: "put",
    description: "Compute and add new fields",
    example: "put '$total = $qty * $price'",
    insertText: "put '$total = $qty * $price'",
  },
  {
    name: "step",
    description: "Running deltas, moving averages",
    example: "step -a delta -f amount",
    insertText: "step -a delta -f amount",
  },
  {
    name: "format-values",
    description: "Format numbers and strings",
    example: "format-values -f %.2f",
    insertText: "format-values -f %.2f",
  },
  {
    name: "fill-down",
    description: "Fill empty fields from the previous row",
    example: "fill-down -f field1",
    insertText: "fill-down -f field1",
  },
  {
    name: "fill-empty",
    description: "Replace empty values with a literal",
    example: "fill-empty -v 0",
    insertText: "fill-empty -v 0",
  },
  {
    name: "skip-trivial-records",
    description: "Remove all-empty or all-whitespace records",
    example: "skip-trivial-records",
    insertText: "skip-trivial-records",
  },
];

export const OPERATIONS: OperationDefinition[] = MILL_PRD_OPERATIONS.map(
  (operation) => {
    const supportNote = getUnsupportedOperationReason(operation.name);

    return {
      ...operation,
      isSupported: supportNote === null,
      supportNote,
    };
  },
);
