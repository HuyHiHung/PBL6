export function tokens(value: string): string[] {
  return (
    value
      .normalize("NFC")
      .toLowerCase()
      .replace(/[‘’]/g, "'")
      .match(/[\p{L}\p{N}]+(?:'[\p{L}\p{N}]+)*/gu) ?? []
  );
}
export function gradeDictation(reference: string, answer: string) {
  const expected = tokens(reference),
    actual = tokens(answer);
  if (!expected.length || expected.length > 200 || actual.length > 1000)
    throw new Error("invalid_dictation_length");
  const dp = Array.from({ length: expected.length + 1 }, () =>
    Array<number>(actual.length + 1).fill(0),
  );
  for (let i = 0; i <= expected.length; i++) dp[i]![0] = i;
  for (let j = 0; j <= actual.length; j++) dp[0]![j] = j;
  for (let i = 1; i <= expected.length; i++)
    for (let j = 1; j <= actual.length; j++)
      dp[i]![j] = Math.min(
        dp[i - 1]![j - 1]! + (expected[i - 1] === actual[j - 1] ? 0 : 1),
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
      );
  let i = expected.length,
    j = actual.length;
  const alignment: Array<{
    type: "correct" | "substitution" | "missing" | "extra";
    expected: string | null;
    actual: string | null;
  }> = [];
  while (i || j) {
    if (
      i &&
      j &&
      dp[i]![j] ===
        dp[i - 1]![j - 1]! + (expected[i - 1] === actual[j - 1] ? 0 : 1)
    ) {
      alignment.push({
        type: expected[i - 1] === actual[j - 1] ? "correct" : "substitution",
        expected: expected[--i]!,
        actual: actual[--j]!,
      });
    } else if (i && dp[i]![j] === dp[i - 1]![j]! + 1)
      alignment.push({
        type: "missing",
        expected: expected[--i]!,
        actual: null,
      });
    else
      alignment.push({ type: "extra", expected: null, actual: actual[--j]! });
  }
  alignment.reverse();
  const substitutions = alignment.filter(
      (x) => x.type === "substitution",
    ).length,
    missing = alignment.filter((x) => x.type === "missing").length,
    extra = alignment.filter((x) => x.type === "extra").length;
  return {
    grading_policy_version: 1,
    reference_count: expected.length,
    correct: alignment.filter((x) => x.type === "correct").length,
    substitutions,
    missing,
    extra,
    score:
      Math.round(
        Math.max(
          0,
          100 * (1 - (substitutions + missing + extra) / expected.length),
        ) * 10,
      ) / 10,
    alignment,
  };
}
