function splitCommandSegments(parsedArgs: string[]) {
  const segments: string[][] = [];
  let currentSegment: string[] = [];

  for (const token of parsedArgs) {
    if (token === "then") {
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }
      currentSegment = [];
      continue;
    }

    currentSegment.push(token);
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

function flattenCommandSegments(segments: string[][]) {
  return segments.flatMap((segment, index) =>
    index === 0 ? segment : ["then", ...segment],
  );
}

function toDslFieldReference(fieldName: string) {
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(fieldName)) {
    return `$${fieldName}`;
  }

  return `$[${JSON.stringify(fieldName)}]`;
}

function normalizeUniqSegment(segment: string[]) {
  if (segment[0] !== "uniq") {
    return segment;
  }

  const hasOutputMode = segment.includes("-c") || segment.includes("-n");

  if (hasOutputMode || segment.includes("-x")) {
    return segment;
  }

  for (let index = 1; index < segment.length; index += 1) {
    const token = segment[index];
    const nextToken = segment[index + 1] ?? null;

    if ((token === "-f" || token === "-g") && nextToken) {
      return ["head", "-n", "1", "-g", nextToken];
    }
  }

  return segment;
}

function normalizeFormatValuesSegment(segment: string[]) {
  if (segment[0] !== "format-values" || !segment.includes("-k")) {
    return segment;
  }

  let floatFormat: string | null = null;
  let fieldList: string | null = null;

  for (let index = 1; index < segment.length; index += 1) {
    const token = segment[index];
    const nextToken = segment[index + 1] ?? null;

    if (token === "-f" && nextToken) {
      floatFormat = nextToken;
      index += 1;
      continue;
    }

    if (token === "-k" && nextToken) {
      fieldList = nextToken;
      index += 1;
    }
  }

  if (!floatFormat || !fieldList) {
    return segment;
  }

  const fieldNames = fieldList
    .split(",")
    .map((fieldName) => fieldName.trim())
    .filter(Boolean);

  if (fieldNames.length === 0) {
    return segment;
  }

  const assignments = fieldNames.map((fieldName) => {
    const fieldReference = toDslFieldReference(fieldName);

    return `${fieldReference} = fmtnum(${fieldReference}, ${JSON.stringify(floatFormat)})`;
  });

  return ["put", assignments.join("; ")];
}

function normalizeCountDistinctSegment(segment: string[]) {
  if (segment[0] !== "count-distinct") {
    return segment;
  }

  if (segment.includes("-n") || segment.includes("-x")) {
    return segment;
  }

  let groupByFields: string | null = null;

  for (let index = 1; index < segment.length; index += 1) {
    const token = segment[index];
    const nextToken = segment[index + 1] ?? null;

    if (token === "-g" && nextToken) {
      groupByFields = nextToken;
      index += 1;
    }
  }

  return groupByFields
    ? [...segment, "then", "count", "-g", groupByFields]
    : [...segment, "then", "count"];
}

export function normalizeCommandArgs(parsedArgs: string[]) {
  const normalizedSegments = splitCommandSegments(parsedArgs).map((segment) =>
    normalizeCountDistinctSegment(
      normalizeFormatValuesSegment(normalizeUniqSegment(segment)),
    ),
  );

  return flattenCommandSegments(normalizedSegments);
}
