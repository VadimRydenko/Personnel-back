export const ACCOUNT_TYPES = {
  SECURITY_ADMIN: "SECURITY_ADMIN",
  REGISTRY_OPERATOR: "REGISTRY_OPERATOR",
  ANALYST: "ANALYST",
  SERVICE_ACCOUNT: "SERVICE_ACCOUNT",
} as const;

export type AccountType = (typeof ACCOUNT_TYPES)[keyof typeof ACCOUNT_TYPES];

export const ACCOUNT_TYPE_VALUES = Object.values(ACCOUNT_TYPES) as AccountType[];

export type AccountTypeDefinition = {
  code: AccountType;
  title: string;
  description: string;
  hasRegistryDataAccess: boolean;
};

export const ACCOUNT_TYPE_CATALOG: ReadonlyArray<AccountTypeDefinition> = [
  {
    code: ACCOUNT_TYPES.SECURITY_ADMIN,
    title: "Адміністратор безпеки",
    description:
      "Керування політиками доступу, аудитом, ролями, без доступу до даних реєстру",
    hasRegistryDataAccess: false,
  },
  {
    code: ACCOUNT_TYPES.REGISTRY_OPERATOR,
    title: "Оператор/Реєстратор",
    description: "Робота з даними реєстру в межах повноважень",
    hasRegistryDataAccess: true,
  },
  {
    code: ACCOUNT_TYPES.ANALYST,
    title: "Аналітик",
    description: "Робота з аналітикою реєстру",
    hasRegistryDataAccess: true,
  },
  {
    code: ACCOUNT_TYPES.SERVICE_ACCOUNT,
    title: "Сервісний обліковий запис",
    description: "Для міжсистемної взаємодії",
    hasRegistryDataAccess: true,
  },
];

export function isAccountType(value: unknown): value is AccountType {
  return typeof value === "string" && ACCOUNT_TYPE_VALUES.includes(value as AccountType);
}

export function getAccountTypeDefinition(
  code: AccountType,
): AccountTypeDefinition {
  const found = ACCOUNT_TYPE_CATALOG.find((item) => item.code === code);

  if (!found) {
    throw new Error(`Unknown account type: ${code as string}`);
  }

  return found;
}
