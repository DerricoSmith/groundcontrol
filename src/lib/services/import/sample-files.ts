/**
 * Sample CSV content for every importer, kept free of "server-only" and
 * Prisma so client components can offer a download without pulling server
 * code into the browser bundle (same reason csv-templates.ts exists).
 *
 * All names here are invented. No real company or person appears in any
 * sample file.
 */

export const SAMPLE_FILES = {
  contact: {
    fileName: "ground-control-sample-contacts.csv",
    content: [
      "account_name,name,email,title,roles,influence_level,relationship_strength,last_interaction_date",
      "Acme Logistics,Dana Whitfield,dana@acme.test,VP Operations,EXECUTIVE_SPONSOR;DECISION_MAKER,HIGH,STRONG,2026-07-10",
      "Acme Logistics,Marco Reyes,marco@acme.test,Operations Manager,CHAMPION,MEDIUM,ADEQUATE,2026-07-18",
      "Brightline Health,Priya Raman,priya@brightline.test,Director of IT,TECHNICAL_CONTACT,MEDIUM,ADEQUATE,",
    ].join("\n"),
  },
  renewal: {
    fileName: "ground-control-sample-renewals.csv",
    content: [
      "account_name,renewal_date,arr,currency,renewal_status,forecast_category,auto_renew,renewal_term_months",
      "Acme Logistics,2026-11-15,84000,USD,PLANNING,LIKELY,true,12",
      "Brightline Health,2026-09-01,152000,USD,CUSTOMER_DISCUSSION,AT_RISK,false,12",
      "Coastal Analytics,2027-01-20,26000,USD,NOT_STARTED,UNCERTAIN,true,12",
    ].join("\n"),
  },
  product_usage: {
    fileName: "ground-control-sample-product-usage.csv",
    content: [
      "account_name,period_start,period_end,active_users,licensed_users,adoption_percentage,seat_utilization_percentage,last_active_date",
      "Acme Logistics,2026-05-01,2026-05-31,42,60,68,70,2026-05-30",
      "Acme Logistics,2026-06-01,2026-06-30,30,60,50,50,2026-06-28",
      "Brightline Health,2026-06-01,2026-06-30,88,90,92,98,2026-06-30",
    ].join("\n"),
  },
  support_ticket: {
    fileName: "ground-control-sample-support-tickets.csv",
    content: [
      "account_name,ticket_id,created_date,closed_date,status,priority,resolution_minutes,satisfaction_score,escalated",
      "Acme Logistics,TCK-1041,2026-06-02,2026-06-04,CLOSED,NORMAL,2880,4.5,false",
      "Acme Logistics,TCK-1108,2026-06-24,,OPEN,URGENT,,,true",
      "Brightline Health,TCK-1112,2026-06-26,2026-06-27,SOLVED,LOW,1440,5,false",
    ].join("\n"),
  },
  interaction: {
    fileName: "ground-control-sample-interactions.csv",
    content: [
      "account_name,interaction_date,interaction_type,contact_email,sentiment,summary,executive_participated",
      "Acme Logistics,2026-06-12,BUSINESS_REVIEW,dana@acme.test,POSITIVE,Quarterly business review,true",
      "Acme Logistics,2026-07-18,CUSTOMER_MEETING,marco@acme.test,NEUTRAL,Adoption check-in,false",
      "Brightline Health,2026-07-02,CUSTOMER_MEETING,priya@brightline.test,MIXED,Implementation status,false",
    ].join("\n"),
  },
} as const;

export type SampleFileKind = keyof typeof SAMPLE_FILES;

export const IMPORT_DESCRIPTIONS: Record<SampleFileKind, { label: string; required: string; unlocks: string }> = {
  contact: {
    label: "Customer contacts",
    required: "Account name (or external account id) and contact name",
    unlocks: "Relationship health, executive sponsor and champion coverage, champion departure risk",
  },
  renewal: {
    label: "Renewals",
    required: "Account name (or external account id) and renewal date",
    unlocks: "Renewal Center, forecast confidence, renewal planning risk",
  },
  product_usage: {
    label: "Product usage",
    required: "Account name (or external account id), period start, period end",
    unlocks: "Product adoption health, usage decline and low adoption risk",
  },
  support_ticket: {
    label: "Support tickets",
    required: "Account name (or external account id), ticket id, created date",
    unlocks: "Support experience health, open priority issue risk",
  },
  interaction: {
    label: "Customer interactions",
    required: "Account name (or external account id), interaction date, interaction type",
    unlocks: "Relationship recency, engagement states, no-recent-interaction risk",
  },
};
