# Launch Checklist

The commercial release is ready only when every item below is true. This list is the founder's own acceptance bar, verbatim in structure — do not weaken it to declare an early win.

## Acceptance criteria

- [ ] A new organization can be created.
- [ ] A user can securely sign in.
- [ ] An organization can invite team members.
- [ ] Tenant isolation tests pass.
- [ ] A consultant can create or configure a client organization with approved, logged, revocable access.
- [ ] Customer account data can be imported from CSV.
- [ ] Renewal data can be imported.
- [ ] Product usage summaries can be imported.
- [ ] Support tickets can be imported.
- [ ] Customer interactions can be imported.
- [ ] Import errors are clearly reported.
- [ ] Customer accounts appear in the portfolio.
- [ ] Account Detail provides a coherent account brief.
- [ ] Health scores are calculated and explained.
- [ ] Risks are detected and explained.
- [ ] Revenue at risk is calculated correctly.
- [ ] Recommended actions are generated.
- [ ] Actions can be assigned and completed.
- [ ] Renewals can be tracked.
- [ ] Voice of Customer themes can be generated and reviewed.
- [ ] An Executive Brief can be generated.
- [ ] The Executive Brief shows source evidence.
- [ ] The Executive Brief can be reviewed before delivery.
- [ ] The Executive Brief can be delivered by email.
- [ ] The demo environment tells a compelling story.
- [ ] The public Signal & State website is complete.
- [ ] Lead forms work.
- [ ] Error monitoring is configured.
- [ ] Audit logging works.
- [ ] Sensitive secrets remain server-side.
- [ ] Critical accessibility issues are addressed.
- [ ] Critical tests pass (see `TESTING.md` priority list).
- [ ] Documentation is current.
- [ ] The application can be deployed to production.
- [ ] Rico can demonstrate the product without developer assistance.
- [ ] The product does not claim unsupported capabilities.
- [ ] The company can onboard a founding client through managed implementation.

**Current status**: none of the above are yet checked. Phase 1 documentation and the Phase 3 multi-tenant data foundation are underway. This checklist will be updated in `CHANGELOG.md` as each phase closes items off.

## Final launch package (to assemble in Phase 12)

1. Production application (deployed)
2. Production website (deployed)
3. Demo organization (seeded, resettable)
4. Admin access instructions
5. Local development instructions (`README.md` / `CONTRIBUTING.md`)
6. Deployment instructions (`ENVIRONMENT.md`)
7. Environment variable guide (`ENVIRONMENT.md`)
8. Security overview (`SECURITY.md`)
9. Data model overview (`DATA_MODEL.md`)
10. Integration roadmap (`ARCHITECTURE.md` + roadmap section below)
11. Product roadmap
12. Sales demo script
13. Founder demo walkthrough
14. Customer onboarding checklist
15. Founding client implementation checklist
16. Customer Intelligence Sprint checklist
17. Sample Executive Brief
18. Sample account risk report
19. Sample Voice of Customer report
20. Sample transformation roadmap
21. Known limitations
22. Launch risks
23. Recommended next actions

Items 12–20 are produced from real demo-org data once Phase 11 is complete — they are generated artifacts, not hand-written marketing collateral, so they stay honest about what the product actually does.

## Post-launch roadmap (do not build before launch scope is stable)

HubSpot, Stripe, Zendesk, Intercom, and Salesforce integrations; PostHog integration; Slack delivery; Gmail/Microsoft 365 analysis with explicit customer permission; Gong/Zoom transcript analysis; predictive renewal modeling once sufficient historical data exists; partner delivery model; portfolio intelligence for VC/PE firms; ecommerce customer intelligence; Shopify integration; benchmarking; success-plan management; QBR generation; automated workflow builder; mobile experience; i18n; Japan market offering; customer portal; board reporting; product-feedback prioritization; expansion forecasting; advocacy/reference management.
