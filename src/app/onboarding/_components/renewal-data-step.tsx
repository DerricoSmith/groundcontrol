import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Button } from "@/components/ui/button";
import { StepHeader } from "./step-header";
import { deferRenewalDataAction } from "@/lib/actions/onboarding-actions";

export function RenewalDataStep({ accountsWithRenewalDate, totalAccounts }: { accountsWithRenewalDate: number; totalAccounts: number }) {
  const allHaveDates = totalAccounts > 0 && accountsWithRenewalDate === totalAccounts;

  return (
    <div>
      <StepHeader
        eyebrow="Renewal data"
        title="Add renewal dates"
        description="Renewal dates help Ground Control show which accounts need planning soon. You can continue without them and add them later."
        effort="Quick"
      />

      <SurfaceCard className="p-6">
        {allHaveDates ? (
          <p className="text-[13.5px] text-text-secondary">
            All {totalAccounts} imported accounts already have a renewal date. Nothing else to do here.
          </p>
        ) : (
          <>
            <p className="text-[13.5px] text-text-secondary">
              {accountsWithRenewalDate} of {totalAccounts} accounts have a renewal date on file. Manual entry and a dedicated renewal CSV import aren&apos;t available in this local build yet.
            </p>
            <div className="mt-4 rounded-lg border border-warning/25 bg-warning-soft p-3 text-[13px] text-text-primary">
              <p className="font-medium">Without renewal dates:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-text-secondary">
                <li>Renewal Center will be limited.</li>
                <li>Revenue due for renewal cannot be calculated reliably.</li>
                <li>Executive Brief renewal sections will remain incomplete.</li>
              </ul>
            </div>
          </>
        )}

        <form action={deferRenewalDataAction} className="mt-6">
          <Button type="submit" className="bg-brand text-white hover:bg-brand-hover">
            Continue without adding more renewal data
          </Button>
        </form>
      </SurfaceCard>
    </div>
  );
}
