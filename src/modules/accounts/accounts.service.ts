import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import {
  ACCOUNT_TYPE_CATALOG,
  type AccountTypeDefinition,
} from "./account-types.js";

export type AccountTypeView = AccountTypeDefinition & {
  id: number;
  notes: string | null;
};

@Injectable()
export class AccountsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listAccountTypes(): Promise<AccountTypeView[]> {
    const rows = await this.prisma.role.findMany({
      where: {
        roleName: { in: ACCOUNT_TYPE_CATALOG.map((item) => item.code) },
      },
    });

    return ACCOUNT_TYPE_CATALOG.map((definition) => {
      const row = rows.find((r) => r.roleName === definition.code);

      return {
        ...definition,
        id: row?.id ?? -1,
        notes: row?.notes ?? null,
      };
    });
  }
}
