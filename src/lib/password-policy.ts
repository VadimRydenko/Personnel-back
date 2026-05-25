export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;
export const PASSWORD_MAX_VALIDITY_DAYS = 180;
export const MIN_PASSWORD_NOVELTY_RATIO = 0.5;

export type PasswordComplexityIssue =
  | "length"
  | "upper"
  | "lower"
  | "digit"
  | "special";

export function getPasswordComplexityIssues(
  password: string,
): PasswordComplexityIssue[] {
  const issues: PasswordComplexityIssue[] = [];

  if (password.length < MIN_PASSWORD_LENGTH) {
    issues.push("length");
  }

  if (!/[\p{Lu}]/u.test(password)) {
    issues.push("upper");
  }

  if (!/[\p{Ll}]/u.test(password)) {
    issues.push("lower");
  }

  if (!/\p{N}/u.test(password)) {
    issues.push("digit");
  }

  if (!/[^\p{L}\p{N}\s]/u.test(password)) {
    issues.push("special");
  }

  return issues;
}

export function isPasswordComplexityOk(password: string): boolean {
  return getPasswordComplexityIssues(password).length === 0;
}

export function passwordNoveltyRatio(
  currentPassword: string,
  newPassword: string,
): number {
  const length = Math.max(currentPassword.length, newPassword.length, 1);
  let diff = 0;

  for (let i = 0; i < length; i++) {
    if (currentPassword[i] !== newPassword[i]) {
      diff++;
    }
  }

  return diff / length;
}

export function isPasswordNovelEnough(
  currentPassword: string,
  newPassword: string,
): boolean {
  return (
    passwordNoveltyRatio(currentPassword, newPassword) >=
    MIN_PASSWORD_NOVELTY_RATIO
  );
}

export function complexityIssueLabel(issue: PasswordComplexityIssue): string {
  switch (issue) {
    case "length":
      return `щонайменше ${MIN_PASSWORD_LENGTH} символів`;
    case "upper":
      return "щонайменше одна велика літера";
    case "lower":
      return "щонайменше одна мала літера";
    case "digit":
      return "щонайменше одна цифра";
    case "special":
      return "щонайменше один спецсимвол (не літера й не цифра)";
  }
}

export function passwordValidUntil(changedAt: Date): Date {
  const until = new Date(changedAt);

  until.setDate(until.getDate() + PASSWORD_MAX_VALIDITY_DAYS);

  return until;
}

export function isPasswordExpiredByMaxAge(
  changedAt: Date | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!changedAt) {
    return false;
  }

  const until = passwordValidUntil(changedAt);

  if (Number.isNaN(until.getTime())) {
    return false;
  }

  return now > until;
}

export type PasswordPolicyAssertion =
  | {
      ok: true;
    }
  | {
      ok: false;
      code:
        | "PASSWORD_COMPLEXITY"
        | "PASSWORD_TOO_LONG"
        | "PASSWORD_NOT_NOVEL_ENOUGH";
      message: string;
    };

export function checkPasswordPolicy(
  newPassword: string,
  options: { currentPassword?: string | undefined } = {},
): PasswordPolicyAssertion {
  if (newPassword.length > MAX_PASSWORD_LENGTH) {
    return {
      ok: false,
      code: "PASSWORD_TOO_LONG",
      message: `Пароль не може містити більше ${MAX_PASSWORD_LENGTH} символів`,
    };
  }

  const issues = getPasswordComplexityIssues(newPassword);

  if (issues.length > 0) {
    return {
      ok: false,
      code: "PASSWORD_COMPLEXITY",
      message: `Новий пароль не відповідає вимогам складності: ${issues.map(complexityIssueLabel).join(", ")}`,
    };
  }

  if (
    options.currentPassword !== undefined &&
    !isPasswordNovelEnough(options.currentPassword, newPassword)
  ) {
    return {
      ok: false,
      code: "PASSWORD_NOT_NOVEL_ENOUGH",
      message: `Новий пароль занадто схожий на поточний: потрібно щонайменше ${Math.round(MIN_PASSWORD_NOVELTY_RATIO * 100)}% відмінних позицій`,
    };
  }

  return { ok: true };
}
