import { Controller, Get, Inject } from "@nestjs/common";
import { AccountsService } from "./accounts.service.js";

@Controller("/api/account-types")
export class AccountsController {
  constructor(@Inject(AccountsService) private readonly accounts: AccountsService) {}

  @Get("/")
  list() {
    return this.accounts.listAccountTypes();
  }
}
