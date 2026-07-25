-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMINISTRATOR', 'EXECUTIVE', 'CS_LEADER', 'CS_MANAGER', 'ANALYST', 'VIEWER', 'SIGNAL_STATE_CONSULTANT');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "HealthCategory" AS ENUM ('STRONG', 'STABLE', 'WATCH', 'AT_RISK', 'CRITICAL');

-- CreateEnum
CREATE TYPE "ForecastCategory" AS ENUM ('COMMITTED', 'LIKELY', 'AT_RISK', 'UNCERTAIN', 'EXPECTED_CHURN', 'RENEWED', 'CHURNED');

-- CreateEnum
CREATE TYPE "RenewalStatus" AS ENUM ('NOT_STARTED', 'PLANNING', 'CUSTOMER_DISCUSSION', 'COMMERCIAL_REVIEW', 'LEGAL_REVIEW', 'PROCUREMENT', 'VERBAL_COMMITMENT', 'RENEWED', 'CHURNED', 'DEFERRED');

-- CreateEnum
CREATE TYPE "HealthComponentType" AS ENUM ('PRODUCT_ADOPTION', 'CUSTOMER_RELATIONSHIP', 'SUPPORT_EXPERIENCE', 'COMMERCIAL_POSITION', 'BUSINESS_OUTCOMES');

-- CreateEnum
CREATE TYPE "RiskSeverity" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('NEW', 'OPEN', 'MONITORING', 'IMPROVING', 'RESOLVED', 'DISMISSED', 'ACCEPTED');

-- CreateEnum
CREATE TYPE "RiskDirection" AS ENUM ('WORSENING', 'STABLE', 'IMPROVING', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ActionStatus" AS ENUM ('SUGGESTED', 'AWAITING_APPROVAL', 'OPEN', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED', 'DISMISSED', 'DRAFT', 'ASSIGNED', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AIReviewState" AS ENUM ('UNREVIEWED', 'ACCEPTED', 'EDITED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OnboardingPath" AS ENUM ('QUICK_START', 'GUIDED_SETUP', 'ASSISTED_SETUP', 'EXPLORE_DEMO');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'REOPENED');

-- CreateEnum
CREATE TYPE "ChecklistItemStatus" AS ENUM ('PENDING', 'BLOCKED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ExecutiveBriefStatus" AS ENUM ('DRAFT', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'SOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('CUSTOMER_MEETING', 'EXECUTIVE_MEETING', 'BUSINESS_REVIEW', 'EMAIL', 'SUPPORT_INTERACTION', 'TRAINING', 'IMPLEMENTATION_SESSION', 'RENEWAL_CONVERSATION', 'EXPANSION_CONVERSATION', 'ESCALATION_CONVERSATION', 'SURVEY_FOLLOW_UP', 'INTERNAL_REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "InteractionSentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'MIXED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EscalationCategory" AS ENUM ('PRODUCT', 'SUPPORT', 'IMPLEMENTATION', 'RELATIONSHIP', 'COMMERCIAL', 'BILLING', 'SECURITY', 'LEGAL', 'EXECUTIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "EscalationSeverity" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EscalationStatus" AS ENUM ('NEW', 'INVESTIGATING', 'ACTION_PLAN_ACTIVE', 'MONITORING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DataQualitySeverity" AS ENUM ('INFORMATION', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DataQualityStatus" AS ENUM ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "dataQualityEvaluatedAt" TIMESTAMP(3),

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationInvitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "token" TEXT NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invitedById" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerAccount" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "externalId" TEXT,
    "segment" TEXT,
    "tier" TEXT,
    "lifecycleStage" TEXT,
    "ownerId" TEXT,
    "arr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "renewalDate" TIMESTAMP(3),
    "healthCategory" "HealthCategory" NOT NULL DEFAULT 'STABLE',
    "dataConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "healthCalculatedAt" TIMESTAMP(3),
    "dataSourceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Renewal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "arr" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "forecastCategory" "ForecastCategory" NOT NULL DEFAULT 'UNCERTAIN',
    "forecastConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ownerId" TEXT,
    "planStatus" TEXT,
    "nextAction" TEXT,
    "externalId" TEXT,
    "status" "RenewalStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "autoRenew" BOOLEAN,
    "noticePeriodDays" INTEGER,
    "renewalTermMonths" INTEGER,
    "customerIntent" TEXT,
    "expectedRenewalAmount" DOUBLE PRECISION,
    "expectedExpansionAmount" DOUBLE PRECISION,
    "expectedContractionAmount" DOUBLE PRECISION,
    "expectedChurnAmount" DOUBLE PRECISION,
    "actualAmount" DOUBLE PRECISION,
    "closeReason" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Renewal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenewalForecastChange" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "renewalId" TEXT NOT NULL,
    "fromCategory" "ForecastCategory",
    "toCategory" "ForecastCategory" NOT NULL,
    "fromConfidence" DOUBLE PRECISION,
    "toConfidence" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenewalForecastChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenewalPlan" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "renewalId" TEXT NOT NULL,
    "ownerId" TEXT,
    "executiveInvolved" BOOLEAN NOT NULL DEFAULT false,
    "internalCommitments" TEXT,
    "customerCommitments" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RenewalPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenewalMilestone" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "renewalPlanId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "notes" TEXT,

    CONSTRAINT "RenewalMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthScore" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "category" "HealthCategory" NOT NULL,
    "calculationVersion" TEXT NOT NULL,
    "previousScore" DOUBLE PRECISION,
    "dataConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "overrideValue" DOUBLE PRECISION,
    "overrideReason" TEXT,
    "overriddenById" TEXT,

    CONSTRAINT "HealthScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthScoreComponent" (
    "id" TEXT NOT NULL,
    "healthScoreId" TEXT NOT NULL,
    "type" "HealthComponentType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "explanation" TEXT NOT NULL,
    "trend" TEXT,

    CONSTRAINT "HealthScoreComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskSignal" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "RiskSeverity" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "revenueExposure" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "RiskStatus" NOT NULL DEFAULT 'OPEN',
    "ownerId" TEXT,
    "currentState" TEXT NOT NULL,
    "whatChanged" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "potentialImpact" TEXT NOT NULL,
    "recommendedResponse" TEXT NOT NULL,
    "executiveInvolvementRecommended" BOOLEAN NOT NULL DEFAULT false,
    "direction" "RiskDirection" NOT NULL DEFAULT 'UNKNOWN',
    "ruleVersion" TEXT NOT NULL DEFAULT 'v1',
    "ruleKey" TEXT,
    "lastEvaluatedAt" TIMESTAMP(3),
    "previousSeverity" "RiskSeverity",
    "resolutionNote" TEXT,
    "dismissalReason" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskStatusChange" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "riskSignalId" TEXT NOT NULL,
    "fromStatus" "RiskStatus",
    "toStatus" "RiskStatus" NOT NULL,
    "reason" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskStatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskEvaluationRun" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ruleVersion" TEXT NOT NULL,
    "triggerSource" TEXT NOT NULL,
    "triggeredById" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "accountsEvaluated" INTEGER NOT NULL DEFAULT 0,
    "rulesEvaluated" INTEGER NOT NULL DEFAULT 0,
    "risksCreated" INTEGER NOT NULL DEFAULT 0,
    "risksUpdated" INTEGER NOT NULL DEFAULT 0,
    "risksResolved" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,

    CONSTRAINT "RiskEvaluationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskRuleConfiguration" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ruleKey" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "thresholds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskRuleConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendedAction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "riskSignalId" TEXT,
    "title" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "ownerId" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "ActionStatus" NOT NULL DEFAULT 'DRAFT',
    "expectedOutcome" TEXT,
    "actualOutcome" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "source" TEXT NOT NULL DEFAULT 'system',
    "renewalId" TEXT,
    "escalationId" TEXT,
    "blockedReason" TEXT,
    "suggestionKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendedAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "successRows" INTEGER NOT NULL DEFAULT 0,
    "errorRows" INTEGER NOT NULL DEFAULT 0,
    "errorReport" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "eventType" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAnalysisRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workflow" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "subjectType" TEXT,
    "subjectId" TEXT,
    "evidenceRefs" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "isFallback" BOOLEAN NOT NULL DEFAULT false,
    "reviewState" "AIReviewState" NOT NULL DEFAULT 'UNREVIEWED',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIAnalysisRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIUsageRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workflow" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "estimatedCostUsd" DOUBLE PRECISION,
    "latencyMs" INTEGER,
    "succeeded" BOOLEAN NOT NULL DEFAULT true,
    "errorKind" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "role" TEXT,
    "companySize" TEXT,
    "estimatedCustomerCount" TEXT,
    "currentSystems" TEXT,
    "primaryProblem" TEXT,
    "requestedService" TEXT,
    "sourcePage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "ownerId" TEXT,
    "notes" TEXT,
    "nextAction" TEXT,
    "meetingBooked" BOOLEAN NOT NULL DEFAULT false,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingSession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "path" "OnboardingPath",
    "status" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "currentStep" TEXT,
    "completedSteps" JSONB NOT NULL,
    "skippedSteps" JSONB NOT NULL,
    "goals" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "reopenedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SetupChecklistItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "status" "ChecklistItemStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SetupChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSetupProfile" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "companyWebsite" TEXT,
    "industry" TEXT,
    "businessModel" TEXT,
    "arrRange" TEXT,
    "accountCountRange" TEXT,
    "csTeamSizeRange" TEXT,
    "reportingCurrency" TEXT NOT NULL DEFAULT 'USD',
    "timeZone" TEXT,
    "contractModel" TEXT,
    "renewalPeriod" TEXT,
    "currentCrm" TEXT,
    "currentSupportSystem" TEXT,
    "currentBillingSystem" TEXT,
    "currentAnalyticsSystem" TEXT,
    "currentCsPlatform" TEXT,
    "hasFormalHealthScore" BOOLEAN,
    "hasFormalRenewalForecast" BOOLEAN,
    "reviewsFeedbackRegularly" BOOLEAN,
    "healthModelActivated" BOOLEAN NOT NULL DEFAULT false,
    "healthModelWeights" JSONB,
    "activatedRiskRuleKeys" JSONB NOT NULL DEFAULT '[]',
    "executiveBriefConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationSetupProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveBrief" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "status" "ExecutiveBriefStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,

    CONSTRAINT "ExecutiveBrief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutiveBriefSection" (
    "id" TEXT NOT NULL,
    "executiveBriefId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "ExecutiveBriefSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerContact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "title" TEXT,
    "department" TEXT,
    "phone" TEXT,
    "externalId" TEXT,
    "sourceSystem" TEXT,
    "roles" JSONB NOT NULL DEFAULT '[]',
    "influenceLevel" TEXT,
    "relationshipStrength" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastInteractionAt" TIMESTAMP(3),
    "departedAt" TIMESTAMP(3),
    "replacementContactId" TEXT,
    "transitionState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductUsageSummary" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "activeUsers" INTEGER,
    "licensedUsers" INTEGER,
    "loginCount" INTEGER,
    "coreActionsCompleted" INTEGER,
    "featureAdoptionCount" INTEGER,
    "usageFrequency" TEXT,
    "adoptionPercentage" DOUBLE PRECISION,
    "seatUtilizationPercentage" DOUBLE PRECISION,
    "lastActiveAt" TIMESTAMP(3),
    "sourceTrend" TEXT,
    "productArea" TEXT,
    "customMetric" DOUBLE PRECISION,
    "externalId" TEXT,
    "sourceSystem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductUsageSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "externalTicketId" TEXT NOT NULL,
    "createdDate" TIMESTAMP(3) NOT NULL,
    "updatedDate" TIMESTAMP(3),
    "closedDate" TIMESTAMP(3),
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "TicketPriority" NOT NULL DEFAULT 'NORMAL',
    "severity" TEXT,
    "category" TEXT,
    "subject" TEXT,
    "descriptionSummary" TEXT,
    "satisfactionScore" DOUBLE PRECISION,
    "firstResponseMinutes" INTEGER,
    "resolutionMinutes" INTEGER,
    "reopenCount" INTEGER NOT NULL DEFAULT 0,
    "escalated" BOOLEAN NOT NULL DEFAULT false,
    "productArea" TEXT,
    "requesterEmail" TEXT,
    "assignedTeam" TEXT,
    "sourceSystem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerInteraction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "interactionDate" TIMESTAMP(3) NOT NULL,
    "type" "InteractionType" NOT NULL,
    "contactId" TEXT,
    "contactEmail" TEXT,
    "contactName" TEXT,
    "internalOwnerId" TEXT,
    "summary" TEXT,
    "sentiment" "InteractionSentiment" NOT NULL DEFAULT 'UNKNOWN',
    "outcome" TEXT,
    "nextStep" TEXT,
    "nextStepDueDate" TIMESTAMP(3),
    "executiveParticipated" BOOLEAN NOT NULL DEFAULT false,
    "championParticipated" BOOLEAN NOT NULL DEFAULT false,
    "renewalRelated" BOOLEAN NOT NULL DEFAULT false,
    "escalationRelated" BOOLEAN NOT NULL DEFAULT false,
    "externalId" TEXT,
    "sourceSystem" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Escalation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "EscalationCategory" NOT NULL,
    "severity" "EscalationSeverity" NOT NULL,
    "status" "EscalationStatus" NOT NULL DEFAULT 'NEW',
    "ownerId" TEXT,
    "executiveOwnerId" TEXT,
    "description" TEXT NOT NULL,
    "customerImpact" TEXT,
    "revenueExposure" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetResolutionDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolutionSummary" TEXT,
    "customerCommunicationState" TEXT,
    "internalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Escalation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataQualityIssue" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT,
    "category" TEXT NOT NULL,
    "severity" "DataQualitySeverity" NOT NULL,
    "status" "DataQualityStatus" NOT NULL DEFAULT 'OPEN',
    "explanation" TEXT NOT NULL,
    "suggestedResolution" TEXT NOT NULL,
    "sourceRecordType" TEXT,
    "sourceRecordId" TEXT,
    "ownerId" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "dismissalReason" TEXT,
    "ruleVersion" TEXT NOT NULL DEFAULT 'v1',

    CONSTRAINT "DataQualityIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataFreshnessExpectation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "expectedMaxAgeDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataFreshnessExpectation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthModelVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "label" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "weights" JSONB NOT NULL,
    "thresholds" JSONB,
    "activatedAt" TIMESTAMP(3),
    "activatedById" TEXT,
    "deactivatedAt" TIMESTAMP(3),
    "effectiveFrom" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthModelVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthScoreSnapshot" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "category" "HealthCategory" NOT NULL,
    "previousScore" DOUBLE PRECISION,
    "previousCategory" "HealthCategory",
    "changeReason" TEXT,
    "dataConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "calculationVersion" TEXT NOT NULL,
    "healthModelVersionId" TEXT,
    "components" JSONB NOT NULL,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthScoreSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthScoreOverride" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "customerAccountId" TEXT NOT NULL,
    "overrideCategory" "HealthCategory" NOT NULL,
    "overrideScore" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "evidence" TEXT,
    "createdById" TEXT NOT NULL,
    "reviewDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HealthScoreOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionStatusChange" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "fromStatus" "ActionStatus",
    "toStatus" "ActionStatus" NOT NULL,
    "note" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionStatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionComment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Membership_organizationId_idx" ON "Membership"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_organizationId_key" ON "Membership"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_token_key" ON "OrganizationInvitation"("token");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_organizationId_idx" ON "OrganizationInvitation"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_organizationId_status_idx" ON "OrganizationInvitation"("organizationId", "status");

-- CreateIndex
CREATE INDEX "CustomerAccount_organizationId_idx" ON "CustomerAccount"("organizationId");

-- CreateIndex
CREATE INDEX "CustomerAccount_organizationId_healthCategory_idx" ON "CustomerAccount"("organizationId", "healthCategory");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerAccount_organizationId_externalId_key" ON "CustomerAccount"("organizationId", "externalId");

-- CreateIndex
CREATE INDEX "Renewal_organizationId_idx" ON "Renewal"("organizationId");

-- CreateIndex
CREATE INDEX "Renewal_organizationId_periodEnd_idx" ON "Renewal"("organizationId", "periodEnd");

-- CreateIndex
CREATE INDEX "Renewal_customerAccountId_idx" ON "Renewal"("customerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Renewal_organizationId_externalId_key" ON "Renewal"("organizationId", "externalId");

-- CreateIndex
CREATE INDEX "RenewalForecastChange_organizationId_idx" ON "RenewalForecastChange"("organizationId");

-- CreateIndex
CREATE INDEX "RenewalForecastChange_renewalId_idx" ON "RenewalForecastChange"("renewalId");

-- CreateIndex
CREATE UNIQUE INDEX "RenewalPlan_renewalId_key" ON "RenewalPlan"("renewalId");

-- CreateIndex
CREATE INDEX "RenewalPlan_organizationId_idx" ON "RenewalPlan"("organizationId");

-- CreateIndex
CREATE INDEX "RenewalMilestone_organizationId_idx" ON "RenewalMilestone"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "RenewalMilestone_renewalPlanId_key_key" ON "RenewalMilestone"("renewalPlanId", "key");

-- CreateIndex
CREATE INDEX "HealthScore_organizationId_idx" ON "HealthScore"("organizationId");

-- CreateIndex
CREATE INDEX "HealthScore_customerAccountId_calculatedAt_idx" ON "HealthScore"("customerAccountId", "calculatedAt");

-- CreateIndex
CREATE INDEX "HealthScoreComponent_healthScoreId_idx" ON "HealthScoreComponent"("healthScoreId");

-- CreateIndex
CREATE INDEX "RiskSignal_organizationId_idx" ON "RiskSignal"("organizationId");

-- CreateIndex
CREATE INDEX "RiskSignal_organizationId_status_idx" ON "RiskSignal"("organizationId", "status");

-- CreateIndex
CREATE INDEX "RiskSignal_organizationId_severity_idx" ON "RiskSignal"("organizationId", "severity");

-- CreateIndex
CREATE UNIQUE INDEX "RiskSignal_customerAccountId_ruleKey_key" ON "RiskSignal"("customerAccountId", "ruleKey");

-- CreateIndex
CREATE INDEX "RiskStatusChange_organizationId_idx" ON "RiskStatusChange"("organizationId");

-- CreateIndex
CREATE INDEX "RiskStatusChange_riskSignalId_idx" ON "RiskStatusChange"("riskSignalId");

-- CreateIndex
CREATE INDEX "RiskEvaluationRun_organizationId_idx" ON "RiskEvaluationRun"("organizationId");

-- CreateIndex
CREATE INDEX "RiskRuleConfiguration_organizationId_idx" ON "RiskRuleConfiguration"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "RiskRuleConfiguration_organizationId_ruleKey_key" ON "RiskRuleConfiguration"("organizationId", "ruleKey");

-- CreateIndex
CREATE INDEX "RecommendedAction_organizationId_idx" ON "RecommendedAction"("organizationId");

-- CreateIndex
CREATE INDEX "RecommendedAction_organizationId_status_idx" ON "RecommendedAction"("organizationId", "status");

-- CreateIndex
CREATE INDEX "RecommendedAction_organizationId_ownerId_idx" ON "RecommendedAction"("organizationId", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendedAction_customerAccountId_suggestionKey_key" ON "RecommendedAction"("customerAccountId", "suggestionKey");

-- CreateIndex
CREATE INDEX "ImportJob_organizationId_idx" ON "ImportJob"("organizationId");

-- CreateIndex
CREATE INDEX "DataSource_organizationId_idx" ON "DataSource"("organizationId");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_idx" ON "AuditEvent"("organizationId");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_eventType_idx" ON "AuditEvent"("organizationId", "eventType");

-- CreateIndex
CREATE INDEX "AIAnalysisRecord_organizationId_idx" ON "AIAnalysisRecord"("organizationId");

-- CreateIndex
CREATE INDEX "AIAnalysisRecord_organizationId_workflow_idx" ON "AIAnalysisRecord"("organizationId", "workflow");

-- CreateIndex
CREATE INDEX "AIAnalysisRecord_subjectType_subjectId_idx" ON "AIAnalysisRecord"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "AIUsageRecord_organizationId_idx" ON "AIUsageRecord"("organizationId");

-- CreateIndex
CREATE INDEX "AIUsageRecord_organizationId_createdAt_idx" ON "AIUsageRecord"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingSession_organizationId_key" ON "OnboardingSession"("organizationId");

-- CreateIndex
CREATE INDEX "SetupChecklistItem_organizationId_idx" ON "SetupChecklistItem"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "SetupChecklistItem_organizationId_key_key" ON "SetupChecklistItem"("organizationId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSetupProfile_organizationId_key" ON "OrganizationSetupProfile"("organizationId");

-- CreateIndex
CREATE INDEX "ExecutiveBrief_organizationId_idx" ON "ExecutiveBrief"("organizationId");

-- CreateIndex
CREATE INDEX "ExecutiveBriefSection_executiveBriefId_idx" ON "ExecutiveBriefSection"("executiveBriefId");

-- CreateIndex
CREATE INDEX "OnboardingEvent_organizationId_idx" ON "OnboardingEvent"("organizationId");

-- CreateIndex
CREATE INDEX "OnboardingEvent_organizationId_eventType_idx" ON "OnboardingEvent"("organizationId", "eventType");

-- CreateIndex
CREATE INDEX "CustomerContact_organizationId_idx" ON "CustomerContact"("organizationId");

-- CreateIndex
CREATE INDEX "CustomerContact_customerAccountId_idx" ON "CustomerContact"("customerAccountId");

-- CreateIndex
CREATE INDEX "CustomerContact_organizationId_email_idx" ON "CustomerContact"("organizationId", "email");

-- CreateIndex
CREATE INDEX "ProductUsageSummary_organizationId_idx" ON "ProductUsageSummary"("organizationId");

-- CreateIndex
CREATE INDEX "ProductUsageSummary_customerAccountId_periodEnd_idx" ON "ProductUsageSummary"("customerAccountId", "periodEnd");

-- CreateIndex
CREATE UNIQUE INDEX "ProductUsageSummary_customerAccountId_periodStart_periodEnd_key" ON "ProductUsageSummary"("customerAccountId", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "SupportTicket_organizationId_idx" ON "SupportTicket"("organizationId");

-- CreateIndex
CREATE INDEX "SupportTicket_customerAccountId_createdDate_idx" ON "SupportTicket"("customerAccountId", "createdDate");

-- CreateIndex
CREATE INDEX "SupportTicket_organizationId_status_idx" ON "SupportTicket"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_organizationId_externalTicketId_key" ON "SupportTicket"("organizationId", "externalTicketId");

-- CreateIndex
CREATE INDEX "CustomerInteraction_organizationId_idx" ON "CustomerInteraction"("organizationId");

-- CreateIndex
CREATE INDEX "CustomerInteraction_customerAccountId_interactionDate_idx" ON "CustomerInteraction"("customerAccountId", "interactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerInteraction_organizationId_externalId_key" ON "CustomerInteraction"("organizationId", "externalId");

-- CreateIndex
CREATE INDEX "Escalation_organizationId_idx" ON "Escalation"("organizationId");

-- CreateIndex
CREATE INDEX "Escalation_organizationId_status_idx" ON "Escalation"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Escalation_customerAccountId_idx" ON "Escalation"("customerAccountId");

-- CreateIndex
CREATE INDEX "DataQualityIssue_organizationId_idx" ON "DataQualityIssue"("organizationId");

-- CreateIndex
CREATE INDEX "DataQualityIssue_organizationId_status_idx" ON "DataQualityIssue"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DataQualityIssue_organizationId_customerAccountId_category_key" ON "DataQualityIssue"("organizationId", "customerAccountId", "category");

-- CreateIndex
CREATE INDEX "DataFreshnessExpectation_organizationId_idx" ON "DataFreshnessExpectation"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "DataFreshnessExpectation_organizationId_category_key" ON "DataFreshnessExpectation"("organizationId", "category");

-- CreateIndex
CREATE INDEX "HealthModelVersion_organizationId_idx" ON "HealthModelVersion"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthModelVersion_organizationId_version_key" ON "HealthModelVersion"("organizationId", "version");

-- CreateIndex
CREATE INDEX "HealthScoreSnapshot_organizationId_idx" ON "HealthScoreSnapshot"("organizationId");

-- CreateIndex
CREATE INDEX "HealthScoreSnapshot_customerAccountId_calculatedAt_idx" ON "HealthScoreSnapshot"("customerAccountId", "calculatedAt");

-- CreateIndex
CREATE INDEX "HealthScoreOverride_organizationId_idx" ON "HealthScoreOverride"("organizationId");

-- CreateIndex
CREATE INDEX "HealthScoreOverride_customerAccountId_isActive_idx" ON "HealthScoreOverride"("customerAccountId", "isActive");

-- CreateIndex
CREATE INDEX "ActionStatusChange_organizationId_idx" ON "ActionStatusChange"("organizationId");

-- CreateIndex
CREATE INDEX "ActionStatusChange_actionId_idx" ON "ActionStatusChange"("actionId");

-- CreateIndex
CREATE INDEX "ActionComment_organizationId_idx" ON "ActionComment"("organizationId");

-- CreateIndex
CREATE INDEX "ActionComment_actionId_idx" ON "ActionComment"("actionId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAccount" ADD CONSTRAINT "CustomerAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAccount" ADD CONSTRAINT "CustomerAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerAccount" ADD CONSTRAINT "CustomerAccount_dataSourceId_fkey" FOREIGN KEY ("dataSourceId") REFERENCES "DataSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Renewal" ADD CONSTRAINT "Renewal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Renewal" ADD CONSTRAINT "Renewal_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalForecastChange" ADD CONSTRAINT "RenewalForecastChange_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "Renewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalPlan" ADD CONSTRAINT "RenewalPlan_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "Renewal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalMilestone" ADD CONSTRAINT "RenewalMilestone_renewalPlanId_fkey" FOREIGN KEY ("renewalPlanId") REFERENCES "RenewalPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthScore" ADD CONSTRAINT "HealthScore_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthScore" ADD CONSTRAINT "HealthScore_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthScoreComponent" ADD CONSTRAINT "HealthScoreComponent_healthScoreId_fkey" FOREIGN KEY ("healthScoreId") REFERENCES "HealthScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskSignal" ADD CONSTRAINT "RiskSignal_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskStatusChange" ADD CONSTRAINT "RiskStatusChange_riskSignalId_fkey" FOREIGN KEY ("riskSignalId") REFERENCES "RiskSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskEvaluationRun" ADD CONSTRAINT "RiskEvaluationRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskRuleConfiguration" ADD CONSTRAINT "RiskRuleConfiguration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedAction" ADD CONSTRAINT "RecommendedAction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedAction" ADD CONSTRAINT "RecommendedAction_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendedAction" ADD CONSTRAINT "RecommendedAction_riskSignalId_fkey" FOREIGN KEY ("riskSignalId") REFERENCES "RiskSignal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSource" ADD CONSTRAINT "DataSource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAnalysisRecord" ADD CONSTRAINT "AIAnalysisRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIUsageRecord" ADD CONSTRAINT "AIUsageRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingSession" ADD CONSTRAINT "OnboardingSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SetupChecklistItem" ADD CONSTRAINT "SetupChecklistItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationSetupProfile" ADD CONSTRAINT "OrganizationSetupProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveBrief" ADD CONSTRAINT "ExecutiveBrief_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutiveBriefSection" ADD CONSTRAINT "ExecutiveBriefSection_executiveBriefId_fkey" FOREIGN KEY ("executiveBriefId") REFERENCES "ExecutiveBrief"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingEvent" ADD CONSTRAINT "OnboardingEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductUsageSummary" ADD CONSTRAINT "ProductUsageSummary_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductUsageSummary" ADD CONSTRAINT "ProductUsageSummary_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInteraction" ADD CONSTRAINT "CustomerInteraction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInteraction" ADD CONSTRAINT "CustomerInteraction_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInteraction" ADD CONSTRAINT "CustomerInteraction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CustomerContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escalation" ADD CONSTRAINT "Escalation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Escalation" ADD CONSTRAINT "Escalation_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityIssue" ADD CONSTRAINT "DataQualityIssue_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataQualityIssue" ADD CONSTRAINT "DataQualityIssue_customerAccountId_fkey" FOREIGN KEY ("customerAccountId") REFERENCES "CustomerAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataFreshnessExpectation" ADD CONSTRAINT "DataFreshnessExpectation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthModelVersion" ADD CONSTRAINT "HealthModelVersion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthScoreSnapshot" ADD CONSTRAINT "HealthScoreSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthScoreOverride" ADD CONSTRAINT "HealthScoreOverride_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionStatusChange" ADD CONSTRAINT "ActionStatusChange_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "RecommendedAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionComment" ADD CONSTRAINT "ActionComment_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "RecommendedAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
