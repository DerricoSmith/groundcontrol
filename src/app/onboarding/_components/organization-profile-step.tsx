import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StepHeader } from "./step-header";
import { saveProfileAction } from "@/lib/actions/onboarding-actions";
import type { OrganizationSetupProfile } from "@prisma/client";

export function OrganizationProfileStep({ existing }: { existing: OrganizationSetupProfile | null }) {
  return (
    <div>
      <StepHeader
        eyebrow="Organization profile"
        title="Tell Ground Control about your company."
        description="This helps Ground Control show numbers in the right context. Nothing here is required to be exact, and it can be changed later."
        effort="Quick"
      />

      <SurfaceCard className="p-6">
        {/* Plain (non-useActionState) form action — return value is only used when validation fails, an edge case for the owner/admin steps that drive this form; see typecheck note in onboarding-actions.ts callers. */}
        <form action={saveProfileAction as unknown as (formData: FormData) => void} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Company website</label>
            <Input name="companyWebsite" defaultValue={existing?.companyWebsite ?? ""} placeholder="acme.com" className="border-border bg-surface" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Industry</label>
            <Input name="industry" defaultValue={existing?.industry ?? ""} placeholder="B2B software" className="border-border bg-surface" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Business model</label>
            <Input name="businessModel" defaultValue={existing?.businessModel ?? ""} placeholder="Subscription" className="border-border bg-surface" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Reporting currency</label>
            <select name="reportingCurrency" defaultValue={existing?.reportingCurrency ?? "USD"} className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[13.5px] text-text-primary">
              <option value="USD">United States dollar (USD)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="GBP">British pound (GBP)</option>
              <option value="JPY">Japanese yen (JPY)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Approximate annual recurring revenue</label>
            <select name="arrRange" defaultValue={existing?.arrRange ?? ""} className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[13.5px] text-text-primary">
              <option value="">Unknown</option>
              <option value="under_2m">Under $2M</option>
              <option value="2m_10m">$2M to $10M</option>
              <option value="10m_30m">$10M to $30M</option>
              <option value="over_30m">Over $30M</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Approximate customer accounts</label>
            <select name="accountCountRange" defaultValue={existing?.accountCountRange ?? ""} className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[13.5px] text-text-primary">
              <option value="">Unknown</option>
              <option value="under_50">Under 50</option>
              <option value="50_200">50 to 200</option>
              <option value="200_1000">200 to 1,000</option>
              <option value="over_1000">Over 1,000</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Customer Success team size</label>
            <select name="csTeamSizeRange" defaultValue={existing?.csTeamSizeRange ?? ""} className="h-9 w-full rounded-lg border border-border bg-surface px-2.5 text-[13.5px] text-text-primary">
              <option value="">Unknown</option>
              <option value="1_2">1 to 2</option>
              <option value="3_10">3 to 10</option>
              <option value="over_10">Over 10</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Primary time zone</label>
            <Input name="timeZone" defaultValue={existing?.timeZone ?? ""} placeholder="America/New_York" className="border-border bg-surface" />
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-medium text-text-secondary">Current CRM</label>
            <Input name="currentCrm" defaultValue={existing?.currentCrm ?? ""} placeholder="Not used" className="border-border bg-surface" />
          </div>

          <div className="sm:col-span-2 space-y-2 pt-1">
            <label className="flex items-center gap-2 text-[13px] text-text-secondary">
              <input type="checkbox" name="hasFormalHealthScore" defaultChecked={existing?.hasFormalHealthScore ?? false} className="h-3.5 w-3.5" />
              We already have a formal customer health score
            </label>
            <label className="flex items-center gap-2 text-[13px] text-text-secondary">
              <input type="checkbox" name="hasFormalRenewalForecast" defaultChecked={existing?.hasFormalRenewalForecast ?? false} className="h-3.5 w-3.5" />
              We already have a formal renewal forecast
            </label>
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" className="bg-brand text-white hover:bg-brand-hover">
              Continue
            </Button>
          </div>
        </form>
      </SurfaceCard>
    </div>
  );
}
