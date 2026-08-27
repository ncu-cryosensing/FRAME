export function addResult(
  result,
  condition,
  successMsg,
  failureMsg,
  level,
  principle
) {
  result.totalChecks++;

  result.totalScores[principle]++;

  if (condition) {

    result.passed++;

    result.passedScores[principle]++;

    result.passedChecks.push({
      message: successMsg,
      level,
      principle,
    });

  } else {

    if (level === "REQUIRED") {

      result.failed++;

      result.failedChecks.push({
        message: failureMsg,
        level,
        principle,
      });

    } else {

      result.warnings++;

      result.warningChecks.push({
        message: failureMsg,
        level,
        principle,
      });

    }
  }
}