import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Resolves a CSV row's account reference to a CustomerAccount id.
 *
 * This is the single place cross-organization matching is prevented. Every
 * importer routes through it rather than writing its own lookup, so the
 * guarantee "a row can never attach to another organization's account" is
 * enforced once and tested once.
 *
 * Matching order: external id first (explicit and stable), then
 * case-insensitive name. Name matching is deliberately exact-after-
 * lowercasing — no fuzzy matching, because silently attaching support
 * tickets to the wrong customer is far worse than reporting an unmatched
 * row the user can fix.
 */
export class AccountMatcher {
  private byExternalId = new Map<string, string>();
  private byName = new Map<string, string>();
  private ambiguousNames = new Set<string>();

  private constructor(accounts: Array<{ id: string; name: string; externalId: string | null }>) {
    for (const account of accounts) {
      if (account.externalId) {
        this.byExternalId.set(account.externalId.toLowerCase(), account.id);
      }
      const nameKey = account.name.toLowerCase();
      if (this.byName.has(nameKey)) {
        // Two accounts share a name — matching by name is no longer safe.
        this.ambiguousNames.add(nameKey);
      } else {
        this.byName.set(nameKey, account.id);
      }
    }
  }

  static async forOrganization(organizationId: string): Promise<AccountMatcher> {
    const accounts = await prisma.customerAccount.findMany({
      where: { organizationId },
      select: { id: true, name: true, externalId: true },
    });
    return new AccountMatcher(accounts);
  }

  /** Returns the matched account id, or an error message explaining why no match was made. */
  match(params: { accountName?: string; externalAccountId?: string }): { ok: true; accountId: string } | { ok: false; message: string } {
    if (params.externalAccountId) {
      const id = this.byExternalId.get(params.externalAccountId.toLowerCase());
      if (id) return { ok: true, accountId: id };
      return {
        ok: false,
        message: `No customer account found with external id "${params.externalAccountId}". Import the account first, or correct the identifier.`,
      };
    }

    if (params.accountName) {
      const key = params.accountName.toLowerCase();
      if (this.ambiguousNames.has(key)) {
        return {
          ok: false,
          message: `More than one customer account is named "${params.accountName}". Use an external account id to identify which one.`,
        };
      }
      const id = this.byName.get(key);
      if (id) return { ok: true, accountId: id };
      return {
        ok: false,
        message: `No customer account named "${params.accountName}". Import the account first, or correct the name.`,
      };
    }

    return { ok: false, message: "Missing required field: account_name or external_account_id." };
  }
}

/** Column names every importer accepts for its account reference. */
export const ACCOUNT_REFERENCE_COLUMNS = ["account_name", "external_account_id"] as const;
