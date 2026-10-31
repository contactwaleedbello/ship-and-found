

\# Final Consolidated PRD

The final document follows. Every correction from Sections 8 through 17 review and every cross-section fix is applied. Sections 1 through 7 are unchanged except where cross-section fixes require an edit. Appendices A through E are unchanged. Section 8 through 17 are revised to match the review verdicts. Two new appendices are added: Appendix F for the revised notification matrix clarifications and Appendix G for open items that must be resolved on Day 0\.

\---

\# Product Requirements Document: DG Tech Store

\*\*Version:\*\* 1.3  
\*\*Status:\*\* Source of Truth for Version 1 build  
\*\*Owner:\*\* Product Lead  
\*\*Build target:\*\* 1 week

\---

\#\# Document Control

This PRD is the source of truth for Version 1 of DG Tech Store. Any change to scope, flow, data model, business rule, tech stack, or operations must be recorded here before implementation. Structural assumptions are flagged at the top. No filler. No marketing language. The minimal UX approach is the operating model for every screen and flow.

\---

\#\# Structural Assumptions (Flagged)

\- \*\*Roles assumed:\*\* Visitor, Customer, Store Worker, Owner, Co-owner. Owner or Co-owner has final approval authority. Store Worker verifies payments and updates inventory.  
\- \*\*Authentication assumed:\*\* Phone number plus password. OTP at registration. OTP again at agreement acceptance, which is the moment the customer triggers contract activation. No OTP at application submission.  
\- \*\*NIN verification assumed:\*\* Version 1 records the customer NIN and requires manual review by Owner or Co-owner. Version 1 does not verify NIN against any external registry. NIN must be exactly 11 numeric digits.  
\- \*\*Rejection path assumed:\*\* Owner or Co-owner can reject a pending application. Rejection releases the price lock and stock reservation and sets status Rejected.  
\- \*\*Contract statuses assumed:\*\* Application Pending, Active Flexi-Pay Contract, Defaulted, Completed, Rejected, Resolved, Expired.  
\- \*\*30-day window assumed:\*\* Starts at contract activation. Expiry is at 19:59 WAT on day 30\. Default cron runs at 20:00 WAT daily.  
\- \*\*Price freshness assumed:\*\* A price is stale when the exchange rate multiplier changes after the last published price, or when no price update occurs within the configured freshness window. Global setting. Default 24 hours.  
\- \*\*Pending application expiry assumed:\*\* 24 hours after submission. Expiry releases price lock and stock reservation and sets status Expired.  
\- \*\*WhatsApp reminder triggers assumed:\*\* Contract confirmation at activation. Reminders at 7 days before due, 3 days before due, 1 day before due, on the due date, and on the first day after due. All manual sends from the dashboard, logged.  
\- \*\*Administrative default flag assumed:\*\* Records device serial and marks the contract Defaulted. No remote device locking. Blocks future platform purchases only.  
\- \*\*Data deletion assumed:\*\* Deletion requests route to Owner or Co-owner for NDPA-compliant review. Anonymization after review unless retention is required.  
\- \*\*Store scope assumed:\*\* One physical store location, Shop ATF 03\.  
\- \*\*Staffing assumed:\*\* At least one Store Worker and one Owner or Co-owner available per business day. Accounts are not shared.  
\- \*\*Minimal UX assumed:\*\* Every screen has one primary action. Inline validation. Explicit empty, loading, and error states. No decorative elements. Progressive disclosure. Mobile first for customer flows. Battery life displayed with equal visual weight to price on every device view.  
\- \*\*Tech stack assumed:\*\* Next.js, Node.js, PostgreSQL, Prisma, Tailwind CSS. Build target 1 week with the trimmed Version 1 scope.  
\- \*\*No email assumed:\*\* The User model has no email field. All Owner and Co-owner alerting is in-app dashboard plus manual WhatsApp.

\---

\#\# 1\. Executive Summary and Product Scope

\#\#\# 1.1 Executive Summary

DG Tech Store is a web platform that displays real-time device availability, specifications, and dynamic prices. It enables customers to apply for a structured part-payment plan with an Owner-approved 70% to 80% down payment and a strict 30-day balance completion window.

\#\#\# 1.2 Target Users

\- Tech shoppers aged 20 to 35\.  
\- Predominantly students, young workers, and traders around Ahmadu Bello Way.  
\- Example: Ahmed, a 22-year-old university student whose old laptop crashed. He visits the platform twice a week to check mid-range laptop prices and battery specifications. He often has no specific task. What brings him back is browsing price updates and checking whether his preferred device model has dropped in price or changed in availability status.

\#\#\# 1.3 Problem

A student visits Shop ATF 03 wanting a laptop priced at ₦300,000. They have ₦220,000 in cash. The store traditionally accepts zero part-payment. The student leaves to find a cheaper, inferior device or borrows money at high interest. The store loses a sale. Trust erodes on both sides because pricing is uncertain and informal credit lacks transparent tracking.

\#\#\# 1.4 Product Differentiator

Generic e-commerce plugins assume full payment or third-party credit card installment apps. Generic inventory tools treat all customers uniformly. DG Tech Store uses a localized cash and transfer down-payment workflow tied to physical shop worker verification at Shop ATF 03\. It requires manual Owner approval combined with local risk controls: device serial tracking, guarantor details, and platform purchase blocking. It surfaces battery life specifications with equal visual prominence to price because electricity unreliability makes battery life a primary purchase driver for this audience.

\#\#\# 1.5 Version 1 Scope

\- Display device inventory filtered by brand, category, performance tier, and battery life.  
\- Show real-time availability, specifications, and dynamic prices.  
\- Provide a part-payment calculator.  
\- Accept part-payment applications with personal details, NIN, guarantor name and phone, and a 70% to 80% down payment.  
\- Route applications to Owner dashboard for review.  
\- Lock price and reserve stock on valid submission.  
\- Generate a pending agreement. Require customer acceptance with OTP.  
\- Require Store Worker verification of cash or bank transfer down payment.  
\- Require Owner or Co-owner final approval from a different user.  
\- Track remaining balance on a 30-day countdown.  
\- Send manual WhatsApp messages from the dashboard with a logged record.  
\- Enforce full status lifecycle: Application Pending, Active Flexi-Pay Contract, Defaulted, Completed, Rejected, Resolved, Expired.  
\- Record identity, NIN, phone, transaction logs, device serials, and guarantor details for Version 2\.  
\- Apply NDPA-compliant retention and anonymization review.

\#\#\# 1.6 Explicitly Cut from Version 1

\- Automated payment gateway webhook integrations.  
\- Automated WhatsApp API integration.  
\- Automated NDPA anonymization workflow.  
\- Automated remote device locking.  
\- External NIN verification API.

\#\#\# 1.7 Admin and Back-Office Screens Cut and Why

\- Automated webhook payment verification cut because human verification at the shop is required anyway.  
\- Automated credit scoring cut because the audience profile and the 1-week build do not support a trained model.  
\- Automated debt recovery cut because local relationship management handles default recovery in Version 1\.

\#\#\# 1.8 Success Metrics

\- \*\*Applications per week:\*\* Count of submitted applications. Baseline placeholder.  
\- \*\*Approval to activation rate:\*\* Target 70 percent or higher. Activated contracts divided by approved applications.  
\- \*\*Default rate:\*\* Target 10 percent or lower. Defaulted contracts divided by activated contracts.  
\- \*\*Average time from application to activation:\*\* Target 48 hours or lower.  
\- \*\*Repeat browsing rate:\*\* Visitors returning at least twice in 7 days. Baseline placeholder.

\---

\#\# 2\. User Personas, User Journeys, and Core Workflows

\#\#\# 2.1 Personas

\*\*Visitor:\*\* Unauthenticated. Browses inventory, filters, views specs, uses calculator. Cannot apply.

\*\*Customer (Ahmed):\*\* 22-year-old university student. Needs a mid-range laptop for academic work. Browses twice a week. Checks price updates, preferred device model price drops, battery specifications, and availability. Applies for part-payment when cash flow limits full payment.

\*\*Store Worker:\*\* Works at Shop ATF 03\. Updates inventory for Owner approval. Verifies cash or bank transfer down payments. Records transaction logs. Records balance and settlement payments. Sends logged WhatsApp reminders and manual notifications.

\*\*Owner:\*\* Final approval authority. Reviews applications. Grants final approval. Adjusts exchange rate multipliers. Approves inventory changes. Resolves defaults. Reviews deletion requests. Holds pseudonymous ID mapping for legal disputes.

\*\*Co-owner:\*\* Same permissions as Owner. Cannot be the same user as the verifier on the same application.

\#\#\# 2.2 User Journey Maps

\#\#\#\# 2.2.1 Visitor Journey

1\. Land on Home / Inventory Listing.  
2\. Apply filters: brand, category, performance tier, battery life.  
3\. Scan device cards. Price and battery life show with equal prominence.  
4\. Click a device card.  
5\. Land on Device Detail. Specs, stock, price, calculator.  
6\. Adjust down payment percentage from 70 to 80\. See down payment, remaining balance, 30-day window.  
7\. Click Apply for Part-Payment.  
8\. Redirect to Login or Register if not authenticated.  
9\. Continue into Customer journey.

\#\#\#\# 2.2.2 Customer Journey (Ahmed)

1\. Register with phone, password, OTP.  
2\. Land on Home.  
3\. Browse and filter.  
4\. Click Apply on Device Detail.  
5\. Fill Apply form: full name, NIN, guarantor name, guarantor phone, personal details, down payment amount.  
6\. Submit. Inline validation. Revalidation against current price.  
7\. See Application Pending screen with 24-hour countdown.  
8\. Wait for Owner review.  
9\. Receive manual WhatsApp from Store Worker when approved for payment verification.  
10\. Visit Shop ATF 03\. Pay down payment in cash or bank transfer.  
11\. Store Worker records payment.  
12\. Receive manual WhatsApp "Payment verified. Accept your agreement."  
13\. Open platform. Read agreement. Accept with OTP.  
14\. Owner grants final approval from different user.  
15\. Receive WhatsApp contract confirmation. 30-day countdown starts.  
16\. View Contract Detail. Remaining balance. Countdown. Payment history.  
17\. Receive WhatsApp reminders at 7, 3, 1 day before due, on due date, and 1 day after.  
18\. Pay balance in cash or bank transfer. Store Worker records.  
19\. See Completed status.  
20\. Optionally submit a deletion request.

\#\#\#\# 2.2.3 Store Worker Journey

1\. Log in.  
2\. Land on Worker Dashboard. Queues: Payments to Verify, Reminder Checklist, Reserved Units.  
3\. Open payment to verify. See customer name, device, locked price, down payment, application ID.  
4\. Confirm cash or bank transfer physically received.  
5\. Record transaction log: method, amount, date and time, receiving account or drawer reference, Worker ID.  
6\. Optionally upload receipt.  
7\. Check verification box.  
8\. See application move to Awaiting Final Approval.  
9\. Send manual WhatsApp "Payment verified. Accept your agreement."  
10\. Open Reminder Checklist. Send reminders manually. Mark as Sent.  
11\. Open Reserved Units. Confirm physical tag. Block in-store sale of reserved serial.  
12\. Open Inventory Update. Update stock or base price. Submit for Owner approval.  
13\. Open Record Balance Payment or Record Settlement Payment. Record. Submit.

\#\#\#\# 2.2.4 Owner and Co-owner Journey

1\. Log in.  
2\. Land on Owner Dashboard. Queues: New Applications, Awaiting Final Approval, Defaulted Contracts, Deletion Requests, Inventory Approvals. Success Metrics at top.  
3\. Open New Application. See customer details, NIN, guarantor, device, locked price, down payment, balance.  
4\. Approve for verification, or reject with reason.  
5\. After Worker verification and customer acceptance, open Awaiting Final Approval. Same-user rule blocks if approver equals verifier.  
6\. Grant final approval. Contract activates.  
7\. Adjust exchange rate multiplier in Settings. Prices recalculate.  
8\. Open Defaulted Contracts. Mark Resolved only after full remaining balance recorded.  
9\. Open Deletion Requests. Review. Record decision, reason, anonymized fields.  
10\. Open Inventory Approvals. Approve or reject.  
11\. Open Audit Log. Review.  
12\. Review Success Metrics.  
13\. Receive in-app alerts if cron heartbeat is stale or if IP collision detected on verification and final approval.

\#\#\# 2.3 Core Workflows (Step by Step with Branches)

\#\#\#\# 2.3.1 Workflow 1: Browse and Filter Inventory

1\. Visitor opens platform.  
2\. Applies filters: brand, category, performance tier, battery life.  
3\. System returns matching devices. Empty state if zero: "No devices match your filters. Clear filters to see all devices."  
4\. Device cards show price and battery life with equal weight.  
5\. Click a device. Land on Device Detail.  
6\. If available stock is zero, show "Out of Stock. Confirm Current Price via WhatsApp."  
7\. If price is stale, show "Price may have changed. Confirm Current Price via WhatsApp."  
8\. Use calculator.  
9\. Click Apply for Part-Payment.  
10\. If unauthenticated, redirect to Login or Register.

\#\#\#\# 2.3.2 Workflow 2: Apply for Part-Payment

1\. Customer lands on Apply form. Phone prefilled.  
2\. Enters full name, NIN, guarantor name, guarantor phone, personal details, down payment amount.  
3\. Inline validation runs on blur. NIN exactly 11 numeric digits. Phone valid Nigerian format. Down payment in 70 to 80 percent of current price.  
4\. Clicks Submit.  
5\. System checks available stock. If zero, show "Out of Stock. Confirm Current Price via WhatsApp." Refuse.  
6\. System checks price freshness. If stale, show "Price may have changed. Confirm Current Price via WhatsApp." Refuse.  
7\. System revalidates down payment against current price. If price changed, show notice with old and new price and new range. Customer confirms or cancels.  
8\. If valid: lock price, increment reserved\_count, set expires\_at 24 hours, generate pending agreement, set status Application Pending, route to Owner dashboard. All in one transaction.  
9\. Customer sees Application Pending with 24-hour countdown.  
10\. Branch A: 24-hour expiry. Release price lock, decrement reserved\_count, status Expired.  
11\. Branch B: Owner rejects with reason. Release price lock, decrement reserved\_count, status Rejected, reason shown.  
12\. Branch C: Owner approves for payment verification. Store Worker sends manual WhatsApp "Approved for payment verification. Visit Shop ATF 03." Status Awaiting Down Payment Verification.

\#\#\#\# 2.3.3 Workflow 3: Verify, Accept Agreement, Activate

1\. Owner reviews pending application.  
2\. May reject with reason. See Branch B.  
3\. Approves for verification. Status Awaiting Down Payment Verification.  
4\. Store Worker opens application in Payments to Verify.  
5\. Confirms cash or bank transfer physically received.  
6\. Records transaction log. Optional receipt upload. Checks verification box.  
7\. System logs verification in AuditLog with IP. Does not activate contract.  
8\. Store Worker sends manual WhatsApp "Payment verified. Accept your agreement."  
9\. Customer opens platform. Reads agreement. Clicks Accept.  
10\. System sends OTP to customer phone.  
11\. Customer enters OTP. System records customer\_accepted\_at.  
12\. Owner or Co-owner opens Awaiting Final Approval.  
13\. System enforces same-user rule. Block if final approver equals verifier.  
14\. System enforces customer\_accepted\_at not null. Block otherwise.  
15\. Owner or Co-owner grants final approval.  
16\. System sets status Active Flexi-Pay Contract, records device serial, starts 30-day countdown, sends contract confirmation WhatsApp.

\*\*Edge cases:\*\*  
\- Customer does not accept within 24 hours of verification. Owner and Co-owner alerted.  
\- Same user attempts both verify and approve. Blocked.  
\- IP collision on verify and approve. Owner alert triggered.

\#\#\#\# 2.3.4 Workflow 4: Track Balance and Complete Contract

1\. Customer sees Active Flexi-Pay Contract: balance, countdown, agreement, payment history.  
2\. Worker sees Reminder Checklist.  
3\. Worker opens a reminder. Template prefilled. Sends via wa.me or copies to clipboard. Marks as Sent.  
4\. Triggers: 7 days before due, 3 days before due, 1 day before due, on due date, on first day after due.  
5\. Customer pays balance. Worker records in Record Balance Payment.  
6\. Partial payments allowed. No extension of 30-day window.  
7\. Full payment triggers status Completed.

\*\*Edge cases:\*\*  
\- Overpayment blocked with error.  
\- Underpayment recorded as partial.  
\- Public holiday does not extend window.

\#\#\#\# 2.3.5 Workflow 5: Handle Default

1\. At 20:00 WAT daily, cron checks Active contracts past 19:59 WAT on day 30\.  
2\. Any with unpaid balance set to Defaulted. Administrative default flag applied. Platform purchase block applied.  
3\. Customer cannot apply for new part-payment.  
4\. Worker records settlement payments against Defaulted contract.  
5\. Owner opens Defaulted Contracts. Marks Resolved only after full remaining balance recorded.  
6\. Platform block lifts on Resolve.

\#\#\#\# 2.3.6 Workflow 6: Handle Data Deletion Request

1\. Customer submits deletion request via Account Settings.  
2\. Routed to Owner dashboard.  
3\. Owner reviews for active contracts, disputes, legal retention.  
4\. Records decision, reason, anonymized fields.  
5\. Anonymizes personal data. Keeps contract and transaction logs in pseudonymized form.  
6\. AuditLog actor\_id pseudonymized. Owner holds mapping.  
7\. Informal requests refused with message directing to Account Settings.

\#\#\#\# 2.3.7 Workflow 7: Confirm Current Price via WhatsApp

1\. Trigger: "Confirm Current Price via WhatsApp" shown when out of stock or stale price.  
2\. Click opens wa.me with prefilled message.  
3\. If wa.me fails, fallback message: "Call Shop ATF 03 or visit in person."  
4\. Worker updates price or stock. Replies.  
5\. Customer refreshes. Sees updated price.

\---

\#\# 3\. Functional Requirements and Feature Specifications

\#\#\# 3.1 Minimal UX Principles

\- One primary action per screen.  
\- Inline validation on every field.  
\- Explicit empty, loading, error states on every screen.  
\- No decorative elements.  
\- Progressive disclosure.  
\- Mobile first for customer flows. Desktop first for Worker and Owner flows.  
\- Battery life equal to price in font size, weight, and card prominence.

\#\#\# 3.2 Screen Inventory

\#\#\#\# Public Screens

\| Screen \| Primary Action \|  
\|---\|---\|  
\| Home / Inventory Listing \| Click device card \|  
\| Device Detail \| Apply for Part-Payment \|  
\| Login \| Log in \|  
\| Register \| Register \|  
\| OTP Verification \| Verify \|  
\| Forgot Password \| Reset \|  
\| Confirm Current Price via WhatsApp \| Open WhatsApp \|

\#\#\#\# Customer Screens

\| Screen \| Primary Action \|  
\|---\|---\|  
\| Apply for Part-Payment \| Submit \|  
\| Application Status \| View contract or reapply \|  
\| My Applications \| Open one \|  
\| Contract Detail \| View agreement or payment history \|  
\| Agreement Acceptance \| Accept with OTP \|  
\| Account Settings \| Submit deletion request \|

\#\#\#\# Store Worker Screens

\| Screen \| Primary Action \|  
\|---\|---\|  
\| Worker Dashboard \| Open a queue \|  
\| Verify Down Payment \| Submit verification \|  
\| Record Balance Payment \| Submit payment \|  
\| Record Settlement Payment \| Submit settlement \|  
\| Reminder Checklist \| Mark as Sent \|  
\| Reserved Units \| Acknowledge \|  
\| Inventory Update \| Submit for Owner approval \|

\#\#\#\# Owner and Co-owner Screens

\| Screen \| Primary Action \|  
\|---\|---\|  
\| Owner Dashboard \| Open a queue \|  
\| Review Application \| Approve for verification or Reject \|  
\| Final Approval \| Approve \|  
\| Exchange Rate Settings \| Save \|  
\| Defaulted Contracts \| Mark Resolved \|  
\| Deletion Requests \| Record decision \|  
\| Inventory Approvals \| Approve or Reject \|  
\| Audit Log \| Filter and view \|  
\| Success Metrics \| View \|

\#\#\# 3.3 Functional Requirements

\#\#\#\# FR-01 Inventory Listing and Filtering

\- Display brand, category, performance tier, battery life, stock status, dynamic price.  
\- Filters: brand, category, performance tier, battery life.  
\- Battery life displayed with equal visual weight to price.  
\- Available stock equals stock\_count minus reserved\_count.  
\- Dynamic price calculated from base price and exchange rate multiplier.  
\- Block checkout when available stock is zero.  
\- Empty state when filters return zero.

\#\#\#\# FR-02 Part-Payment Calculator

\- Public. No writes.  
\- Down payment percentage from 70 to 80\.  
\- Shows down payment, remaining balance, 30-day window.  
\- Disclaimer: "This is an estimate. Final amount is validated at application submission."

\#\#\#\# FR-03 Part-Payment Application

\- Requires authenticated customer with OTP-verified phone.  
\- Collects full name, phone, NIN, guarantor name, guarantor phone, personal details, selected device, down payment amount.  
\- Validates NIN exactly 11 numeric digits.  
\- Validates down payment in 70 to 80 percent of current price.  
\- Validates phone present and Nigerian format.  
\- Validates available stock.  
\- Validates price not stale.  
\- Revalidates down payment against current price at submit. Price change requires confirmation.  
\- Refuses submission when out of stock or stale price. Shows Confirm Current Price via WhatsApp.  
\- On valid submission: atomic transaction locks price, reserves stock, sets expires\_at 24 hours, generates pending agreement, sets status Application Pending, routes to Owner.  
\- No OTP at submission.

\#\#\#\# FR-04 Owner or Co-owner Review

\- Shows customer details, NIN, guarantor, device, locked price, down payment, remaining balance, submission time, expiry countdown.  
\- Reject with required reason. Releases lock and reservation. Status Rejected.  
\- Approve for payment verification.  
\- No automatic approval.

\#\#\#\# FR-05 Store Worker Down-Payment Verification

\- Shows approved applications.  
\- Confirms cash or bank transfer received.  
\- Records exact transaction log.  
\- Optional receipt upload.  
\- Verification checkbox required.  
\- Logs verification in AuditLog with IP address.  
\- Does not activate contract.  
\- Notifies customer via manual WhatsApp "Payment verified. Accept your agreement."

\#\#\#\# FR-06 Final Approval and Contract Activation

\- Requires Owner or Co-owner final approval after verification and customer acceptance.  
\- Enforces same-user rule: approver user\_id differs from verifier user\_id.  
\- Enforces customer\_accepted\_at not null.  
\- Requires OTP on agreement acceptance before recording timestamp.  
\- Sets status Active Flexi-Pay Contract after final approval.  
\- Records device serial. Starts 30-day countdown.  
\- Sends contract confirmation via manual WhatsApp.  
\- Blocks if same-user rule fails, acceptance missing, or OTP not verified.  
\- Logs IP address on final approval. If IP matches verifier IP, Owner alert.

\#\#\#\# FR-07 Balance Tracking and WhatsApp Reminders

\- Contract Detail shows balance and countdown.  
\- Reminder Checklist in Worker Dashboard: 7 days before due, 3 days before due, 1 day before due, on due date, first day after due.  
\- Templates per trigger with device, balance, due date, store contact.  
\- Manual send via wa.me or clipboard copy. Mark as Sent logs with sender, timestamp, content.  
\- Additional manual notifications: "Approved for payment verification" and "Payment verified. Accept your agreement."

\#\#\#\# FR-08 Balance and Settlement Payment Recording

\- Balance payment on Active contracts.  
\- Settlement payment on Defaulted contracts.  
\- Records method, amount, date and time, receiving account or drawer reference, Worker ID.  
\- Partial payments allowed. No window extension.  
\- Blocks overpayment.  
\- Status to Completed when total verified payments equal locked price.  
\- Settlement logged separately.

\#\#\#\# FR-09 Default Handling

\- Default set at 20:00 WAT daily cron for Active contracts past 19:59 WAT day 30\.  
\- Administrative default flag records device serial as defaulted.  
\- Platform purchase block on NIN and phone. Platform only.  
\- Owner or Co-owner resolves after full remaining balance recorded.

\#\#\#\# FR-10 Data Deletion Request

\- Customer submits via Account Settings.  
\- Routes to Owner or Co-owner.  
\- Rejects if Active or Defaulted contract exists. Reason: retention required.  
\- Records decision, reason, anonymized fields.  
\- Anonymizes personal data. Pseudonymizes audit actor\_id.  
\- Refuses informal requests.

\#\#\#\# FR-11 Role-Based Access

\- \*\*Visitor:\*\* browse, filter, view specs, calculate.  
\- \*\*Customer:\*\* apply, accept agreement with OTP, view own application, view own contract, view own payment history, view own agreement, submit deletion request.  
\- \*\*Store Worker:\*\* update inventory for approval, verify down payment, record balance and settlement payments, send logged WhatsApp, view Reserved Units.  
\- \*\*Owner or Co-owner:\*\* review, approve, final approve, adjust exchange rate, approve inventory, resolve defaults, review deletion requests, view audit log, view metrics.  
\- Audit log all actions: approvals, verifications, price changes, reminder sends, agreement acceptances, status changes.  
\- IP address recorded on verification and final approval.

\#\#\#\# FR-12 Stale Price and Out-of-Stock Checkout Refusal

\- Block checkout when available stock is zero or price is stale.  
\- Show Confirm Current Price via WhatsApp.  
\- Do not lock price for blocked checkout.  
\- Fallback if WhatsApp unavailable: "Call Shop ATF 03 or visit in person."

\#\#\#\# FR-13 Inventory and Price Updates

\- Store Worker updates stock and base price.  
\- Owner approves inventory changes.  
\- Co-owner adjusts exchange rate multiplier.  
\- Prices recalculate in real time on multiplier change.  
\- Stock updates in real time on Worker update.

\#\#\#\# FR-14 Status Lifecycle

\- Visitor can browse and calculate.  
\- Application Pending after valid submission.  
\- Expired when pending passes 24 hours. Lock and reservation release.  
\- Rejected when Owner rejects.  
\- Active Flexi-Pay Contract after verification, OTP-verified acceptance, and final approval.  
\- Defaulted at 19:59 WAT day 30 without full payment.  
\- Completed when full payment verified.  
\- Resolved when default settled and cleared. Settled means full remaining balance paid.

\#\#\# 3.4 State Transition Table

\| From \| Event \| To \| Side Effects \|  
\|---\|---\|---\|---\|  
\| (none) \| Valid submission \| Application Pending \| Lock, reserve, expiry 24h, pending agreement \|  
\| Application Pending \| 24h pass \| Expired \| Release lock, release reservation \|  
\| Application Pending \| Owner rejects \| Rejected \| Release lock, release reservation, reason recorded \|  
\| Application Pending \| Owner approves for verification \| Awaiting Down Payment Verification \| Manual WhatsApp to customer \|  
\| Awaiting Down Payment Verification \| Worker verifies \| Awaiting Customer Acceptance \| Log transaction with IP, manual WhatsApp to customer \|  
\| Awaiting Customer Acceptance \| Customer accepts with OTP \| Awaiting Final Approval \| Record customer\_accepted\_at \|  
\| Awaiting Final Approval \| Owner or Co-owner (different user) approves \| Active Flexi-Pay Contract \| Serial recorded, 30-day countdown starts, WhatsApp confirmation \|  
\| Active Flexi-Pay Contract \| Full payment recorded \| Completed \| Contract closed \|  
\| Active Flexi-Pay Contract \| 19:59 WAT day 30 passes without full payment \| Defaulted \| Admin default flag, platform purchase block \|  
\| Defaulted \| Full settlement recorded and Owner marks Resolved \| Resolved \| Platform block lifts \|  
\| Rejected \| Customer reapplies \| (new application) Application Pending \| New lock, new reservation \|  
\| Expired \| Customer reapplies \| (new application) Application Pending \| New lock, new reservation \|

\---

\#\# 4\. Business Rules and Risk Management Controls

\#\#\# 4.1 Business Rules

\- \*\*BR-01 Manual approval only.\*\* No automatic approval.  
\- \*\*BR-02 Down payment threshold.\*\* 70 to 80 percent of current price. Reject outside range.  
\- \*\*BR-03 30-day window.\*\* Starts at activation. Expires at 19:59 WAT day 30\. Default cron at 20:00 WAT.  
\- \*\*BR-04 Price lock.\*\* Validate against current price. On valid submission, lock.  
\- \*\*BR-05 Checkout refusal.\*\* Block when out of stock or stale price. Confirm Current Price via WhatsApp.  
\- \*\*BR-06 Worker verification required.\*\* Exact log and checkbox.  
\- \*\*BR-07 Owner or Co-owner final sign-off.\*\* No exceptions.  
\- \*\*BR-08 Device serial tie.\*\* Recorded at activation.  
\- \*\*BR-09 Default flag.\*\* Set Defaulted at expiry. Admin flag. Platform block on NIN and phone.  
\- \*\*BR-10 NDPA deletion control.\*\* Refuse informal. Route to formal review.  
\- \*\*BR-11 Role separation.\*\* Verify and approve by different users.  
\- \*\*BR-12 Audit trail.\*\* Immutable. Insert-only at DB permission level.  
\- \*\*BR-13 Same-user rule.\*\* Enforced server-side.  
\- \*\*BR-14 Partial payments.\*\* Allowed. No window extension.  
\- \*\*BR-15 Platform-only block.\*\* Does not block in-person purchases at Shop ATF 03\.  
\- \*\*BR-16 No penalty in Version 1.\*\* Settled means full remaining balance paid.  
\- \*\*BR-17 Agreement acceptance required.\*\* OTP-verified. Timestamp recorded.  
\- \*\*BR-18 Stock reservation.\*\* One unit per pending application.  
\- \*\*BR-19 No account sharing.\*\* IP logged on verify and approve. Collision triggers Owner alert.  
\- \*\*BR-20 No destructive migrations.\*\* Version 1 migrations are additive only.

\#\#\# 4.2 Risk Management Controls

\- \*\*Default and asset loss:\*\* 70 to 80 percent down. Serial tie. Logged reminders. Default flag. Platform block. Owner resolution. Down payment cushion is primary protection. Default flag does not recover device.  
\- \*\*Exchange rate volatility:\*\* Dynamic pricing. Real-time multiplier. Price lock at application. Stale block. Fixed 30-day window. Locked contract price unchanged mid-contract.  
\- \*\*Worker collusion:\*\* Exact logs and checkbox. Different user for final approval. Immutable audit. IP logging. Daily Owner reconciliation logged.  
\- \*\*Account sharing:\*\* IP logged on verification and final approval. Collision alert.

\---

\#\# 5\. Data Architecture and NDPA Compliance Requirements

\#\#\# 5.1 Relational Data Model

\*\*User\*\*  
\- user\_id  
\- role  
\- phone\_number  
\- password\_hash  
\- otp\_verified\_at  
\- account\_status  
\- locked\_until

\*\*CustomerProfile\*\*  
\- customer\_id  
\- user\_id  
\- full\_name  
\- NIN, encrypted  
\- phone\_number, encrypted  
\- personal\_details  
\- guarantor\_name  
\- guarantor\_phone

\*\*Device\*\*  
\- device\_id  
\- brand  
\- category  
\- performance\_tier  
\- battery\_life\_spec  
\- model

\*\*Inventory\*\*  
\- inventory\_id  
\- device\_id  
\- stock\_count  
\- reserved\_count  
\- base\_price  
\- inventory\_status  
\- updated\_by\_worker\_id  
\- approved\_by\_owner\_id

\*\*Price\*\*  
\- price\_id  
\- device\_id  
\- exchange\_rate\_multiplier  
\- dynamic\_price  
\- last\_updated\_at

\*\*Settings\*\*  
\- setting\_key  
\- setting\_value  
\- updated\_by  
\- updated\_at  
\- last\_cron\_heartbeat\_at

\*\*PartPaymentApplication\*\*  
\- application\_id  
\- customer\_id  
\- device\_id  
\- locked\_price  
\- down\_payment\_amount  
\- down\_payment\_percent  
\- remaining\_amount  
\- application\_status  
\- created\_at  
\- expires\_at  
\- reviewed\_by  
\- approved\_at  
\- rejection\_reason

\*\*Agreement\*\*  
\- agreement\_id  
\- application\_id  
\- terms  
\- locked\_price  
\- due\_date  
\- agreement\_status  
\- device\_serial  
\- customer\_accepted\_at  
\- acceptance\_otp\_verified

\*\*DownPaymentTransaction\*\*  
\- transaction\_id  
\- application\_id  
\- payment\_method  
\- amount  
\- received\_at  
\- recorded\_by\_worker\_id  
\- receiving\_account\_or\_drawer\_reference  
\- receipt\_image\_url  
\- verification\_checkbox  
\- verified\_at  
\- verifier\_ip

\*\*BalancePaymentTransaction\*\*  
\- transaction\_id  
\- agreement\_id  
\- payment\_method  
\- amount  
\- received\_at  
\- recorded\_by\_worker\_id  
\- receiving\_account\_or\_drawer\_reference

\*\*SettlementLog\*\*  
\- settlement\_id  
\- agreement\_id  
\- transaction\_id  
\- recorded\_at  
\- recorded\_by

\*\*WhatsAppReminderLog\*\*  
\- reminder\_id  
\- agreement\_id  
\- trigger\_type  
\- sent\_at  
\- sent\_by  
\- message\_content

\*\*ConsentRecord\*\*  
\- consent\_id  
\- customer\_id  
\- consent\_type  
\- granted\_at  
\- revoked\_at

\*\*AuditLog\*\*  
\- audit\_id  
\- actor\_id (pseudonymized after anonymization)  
\- action  
\- entity\_type  
\- entity\_id  
\- timestamp  
\- ip\_address  
\- metadata

\*\*DataDeletionRequest\*\*  
\- request\_id  
\- customer\_id  
\- request\_date  
\- reviewer\_id  
\- decision  
\- decision\_reason  
\- anonymized\_fields  
\- anonymized\_at

\#\#\# 5.2 Version 1 Data Collection for Version 2

\- Customer identity data.  
\- NIN.  
\- Phone numbers.  
\- Guarantor name and phone.  
\- Exact down-payment transaction logs.  
\- Device serial numbers.

\#\#\# 5.3 NDPA Compliance Requirements

\- \*\*Lawful basis:\*\* Contract performance. Stored consent for WhatsApp.  
\- \*\*Data minimization:\*\* Only fields listed.  
\- \*\*Access control:\*\* Role-based. NIN to Owner or Co-owner. NIN masked for Worker.  
\- \*\*Encryption:\*\* AES-256 for NIN and phone at rest. TLS in transit.  
\- \*\*Key management:\*\* Environment variables held by Owner. Rotated on staff change during off-hours with logged row counts.  
\- \*\*Retention:\*\* Active contract period plus legal retention. Anonymize after.  
\- \*\*Anonymization review:\*\* Owner or Co-owner processes. Records decision, reason, anonymized fields. Pseudonymizes audit actor\_id.  
\- \*\*Audit:\*\* Log NIN access and deletion decisions.  
\- \*\*No informal deletion.\*\*

\---

\#\# 6\. Out of Scope (Version 1 Boundaries)

\- Automated payment gateway webhooks.  
\- Automated remote device locking.  
\- Automated credit checks or scoring.  
\- Automated third-party bank debt recovery.  
\- Automated peer-to-peer chat bots.  
\- Complex multi-currency wallets.  
\- External NIN verification API.  
\- Guarantor verification (only collection).  
\- Inbound WhatsApp chatbot.  
\- Automated WhatsApp API.  
\- Automated NDPA anonymization workflow.  
\- Customer self-service balance payment through gateway.  
\- Multi-store support beyond Shop ATF 03\.  
\- Late penalties, interest, or fees.  
\- Multi-currency pricing.  
\- Customer-facing chat support.  
\- Push notifications.  
\- SMS beyond OTP.  
\- Email notifications.  
\- Analytics dashboards beyond Success Metrics.  
\- Receipt upload (cut to protect 1-week timeline).  
\- PDF export beyond browser print.

\---

\#\# 7\. Failure Modes and Mitigation Strategies

\#\#\# 7.1 Default and Asset Loss

\*\*Failure:\*\* Customer pays down payment, takes device, disappears without paying balance.

\*\*Mitigation:\*\*  
\- 70 to 80 percent down payment.  
\- Device serial recorded.  
\- 30-day countdown.  
\- Logged WhatsApp reminders.  
\- Default status at 19:59 WAT day 30\.  
\- Administrative default flag.  
\- Platform purchase block on NIN and phone.  
\- Owner or Co-owner resolution after full settlement.

\*\*Residual risk:\*\* Administrative default flag does not recover the device. Down payment cushion is primary financial protection. Recovery depends on manual follow-up.

\#\#\# 7.2 Exchange Rate Volatility

\*\*Failure:\*\* Currency devaluation during 30-day window. Remaining balance insufficient to replace stock cost.

\*\*Mitigation:\*\*  
\- Dynamic prices from base price and multiplier.  
\- Real-time multiplier adjustment.  
\- Price lock at application.  
\- Stale block.  
\- Fixed 30-day window.  
\- No mid-contract price change.

\*\*Residual risk:\*\* Down payment covers 70 to 80 percent of sale price, not replacement cost. Store accepts this residual. Version 2 can add volatility-linked down payment floor.

\#\#\# 7.3 Worker Collusion

\*\*Failure:\*\* Store Worker falsely marks cash payment received.

\*\*Mitigation:\*\*  
\- Exact transaction log.  
\- Verification checkbox as attestation.  
\- Different user for final approval.  
\- Immutable audit log.  
\- IP logging on verification and approval.  
\- Daily Owner reconciliation logged.  
\- IP collision alert.

\#\#\# 7.4 Device Sold While Pending

\*\*Failure:\*\* Reserved device sold to another customer.

\*\*Mitigation:\*\*  
\- Reservation flag on Worker dashboard.  
\- Physical tag on reserved unit.  
\- Release on Expired, Rejected, or Default before pickup.  
\- Block in-store sale of reserved serial.

\#\#\# 7.5 Fake NIN

\*\*Failure:\*\* Customer submits fake NIN.

\*\*Mitigation:\*\*  
\- Exactly 11 numeric digits.  
\- Manual review.  
\- Guarantor name and phone collected.  
\- Unverified NIN flagged for Version 2\.

\#\#\# 7.6 Device Loss or Damage Before Pickup

\*\*Failure:\*\* Device damaged or stolen after activation, before pickup.

\*\*Mitigation:\*\*  
\- Serial recorded at activation.  
\- Customer pickup sign off with timestamp.  
\- 30-day timer paused during open dispute.  
\- Owner or Co-owner resolution.

\#\#\# 7.7 Owner or Co-owner Unavailable for Final Approval

\*\*Failure:\*\* Down payment verified, customer accepted. No Owner or Co-owner available.

\*\*Mitigation:\*\*  
\- Staffing assumption requires one Owner or Co-owner per business day.  
\- Awaiting Final Approval queue shows count.  
\- 24-hour delay triggers in-app dashboard alert.

\#\#\# 7.8 Customer Cannot Receive OTP

\*\*Failure:\*\* No network. Cannot complete registration or acceptance.

\*\*Mitigation:\*\*  
\- "Trouble receiving OTP?" link with in-person fallback.  
\- Store Worker can trigger OTP resend on request with AuditLog entry.  
\- In-person identity check by Owner or Co-owner.

\#\#\# 7.9 Customer Overpays or Underpays

\*\*Failure:\*\* Customer pays wrong amount.

\*\*Mitigation:\*\*  
\- Block overpayment with error.  
\- Record underpayment as partial with recalculation.  
\- Show balance and any overpayment note.

\#\#\# 7.10 Agreement Not Accepted by Customer

\*\*Failure:\*\* Customer pays down payment but does not accept agreement.

\*\*Mitigation:\*\*  
\- "Accept Agreement" reminder in customer dashboard.  
\- Worker reminds at shop.  
\- 24-hour delay triggers Owner and Co-owner in-app alert.

\#\#\# 7.11 Password Reset Account Takeover

\*\*Failure:\*\* Thief with stolen phone resets password via OTP.

\*\*Mitigation:\*\*  
\- 24-hour account lock after password reset.  
\- Previous sessions invalidated.  
\- Owner or Co-owner unlocks after in-person verification.  
\- AuditLog entry.

\#\#\# 7.12 Cron Silent Failure

\*\*Failure:\*\* Cron does not run. Contracts not defaulted. Pending applications not expired.

\*\*Mitigation:\*\*  
\- Cron heartbeat written to Settings on each run.  
\- Heartbeat checked 15 minutes after each cron.  
\- Missing heartbeat triggers in-app Owner alert.  
\- Cron computes from stored timestamps so a missed run does not lose state.

\#\#\# 7.13 IP Collision on Verify and Approve

\*\*Failure:\*\* Same IP performs Worker verification and Owner final approval on same application, suggesting shared accounts or collusion.

\*\*Mitigation:\*\*  
\- IP logged on both events.  
\- Collision triggers Owner alert.  
\- Owner reviews AuditLog before further approvals.

\---

\#\# 8\. Technical Architecture and Tech Stack

\#\#\# 8.1 Stack Decisions

\| Layer \| Choice \| Rationale \|  
\|---\|---\|---\|  
\| Frontend \| Next.js 14 App Router \| Single codebase. Server components for low-end phones. \|  
\| Language \| TypeScript \| Enforces business rules at compile and runtime. \|  
\| Styling \| Tailwind CSS \| Minimal UX. Enforces battery-equals-price visual weight. \|  
\| Backend \| Next.js API routes on Node.js \| One codebase. 1-week friendly. \|  
\| Database \| PostgreSQL 15+ \| ACID transactions for atomic submission. \|  
\| ORM \| Prisma \| Type-safe queries. Transaction support. \|  
\| Authentication \| NextAuth.js Credentials provider \| Phone plus password plus OTP. \*\*Risk accepted:\*\* password hashing, OTP throttling, session fixation protection, CSRF all our responsibility. Independently tested per Section 13.4. \|  
\| OTP delivery \| Termii or Africa's Talking \| Nigerian SMS delivery. \|  
\| File storage \| Supabase Storage or AWS S3 \| Signed URLs. Optional receipt uploads (Version 2). \|  
\| WhatsApp \| wa.me deep links plus clipboard fallback \| Manual sends logged in WhatsAppReminderLog. Worker dashboard designed for mobile browser or desktop with WhatsApp Web. If wa.me fails, Worker copies template to clipboard and marks as sent. \|  
\| Background jobs \| Vercel Cron \| Pending expiry every 5 minutes. Default daily at 20:00 WAT. \|  
\| Hosting \| Vercel plus managed Postgres \| 1-week friendly. \|  
\| Error tracking \| Sentry \| Runtime errors. \|  
\| Logging \| Postgres AuditLog plus Vercel logs \| AuditLog is source of truth. \|  
\| Environments \| Development, Preview, Production \| Secrets in Vercel. \|

\#\#\# 8.2 System Architecture

Single Next.js application with three layers.

\*\*Presentation:\*\* React server and client components. Tailwind. Mobile-first for customers. Desktop-first for Worker and Owner.

\*\*Application:\*\* API routes grouped by domain: auth, inventory, pricing, application, approval, payment, reminder, deletion, audit. Role enforcement and business rules from Section 4\.

\*\*Data:\*\* PostgreSQL via Prisma. All multi-table writes in single transactions:  
\- Application submission: lock Price, increment reserved\_count, insert application, write AuditLog.  
\- Application expiry: decrement reserved\_count, release lock, write AuditLog.  
\- Contract activation: update Agreement status, record serial, set due\_date, write AuditLog.

\*\*External:\*\* SMS for OTP. S3 for receipts (Version 2). wa.me for WhatsApp. No payment gateway. No NIN registry. No credit bureau.

\#\#\# 8.3 API Surface

\*\*Auth\*\*  
\- \`POST /api/auth/register\` public  
\- \`POST /api/auth/verify-otp\` public  
\- \`POST /api/auth/login\` public  
\- \`POST /api/auth/logout\`  
\- \`POST /api/auth/forgot-password\` public  
\- \`POST /api/auth/reset-password\` public. Applies 24-hour account lock.  
\- \`POST /api/auth/accept-agreement-otp\` Customer. Triggers OTP for agreement acceptance.

\*\*Inventory and Pricing\*\*  
\- \`GET /api/devices\` public with filters  
\- \`GET /api/devices/:id\` public  
\- \`POST /api/calculator\` public

\*\*Application\*\*  
\- \`POST /api/applications\` Customer. Atomic.  
\- \`GET /api/applications/mine\` Customer  
\- \`GET /api/applications/:id\` Customer owner, Worker, Owner or Co-owner  
\- \`POST /api/applications/:id/accept-agreement\` Customer. Requires OTP verification.

\*\*Approval\*\*  
\- \`GET /api/admin/applications\` Owner or Co-owner  
\- \`POST /api/admin/applications/:id/approve-for-verification\`  
\- \`POST /api/admin/applications/:id/reject\`  
\- \`POST /api/admin/applications/:id/final-approve\` Owner or Co-owner. Same-user rule and acceptance check inside transaction. IP logged.

\*\*Worker Payments\*\*  
\- \`GET /api/worker/payments-to-verify\`  
\- \`POST /api/worker/down-payment\` Worker. IP logged.  
\- \`POST /api/worker/balance-payment\`  
\- \`POST /api/worker/settlement-payment\`  
\- \`POST /api/worker/otp-resend\` Worker. In-person fallback with AuditLog.

\*\*Reminders\*\*  
\- \`GET /api/worker/reminders\`  
\- \`POST /api/worker/reminders/:id/mark-sent\`

\*\*Inventory Updates\*\*  
\- \`POST /api/worker/inventory\`  
\- \`GET /api/admin/inventory-approvals\`  
\- \`POST /api/admin/inventory-approvals/:id/approve\`  
\- \`POST /api/admin/inventory-approvals/:id/reject\`

\*\*Exchange Rate\*\*  
\- \`POST /api/admin/exchange-rate\`

\*\*Defaults\*\*  
\- \`GET /api/admin/defaults\`  
\- \`POST /api/admin/defaults/:id/resolve\`

\*\*Deletion\*\*  
\- \`POST /api/customer/deletion-request\`  
\- \`GET /api/admin/deletion-requests\`  
\- \`POST /api/admin/deletion-requests/:id/decide\`

\*\*Audit and Metrics\*\*  
\- \`GET /api/admin/audit\`  
\- \`GET /api/admin/metrics\` returns five Success Metrics

\*\*Cron\*\*  
\- \`POST /api/cron/expire-applications\` runs every 5 minutes, secret header  
\- \`POST /api/cron/default-contracts\` runs at 20:00 WAT daily, secret header, writes heartbeat

\#\#\# 8.4 Third-Party Dependencies

\- Termii or Africa's Talking (OTP)  
\- Supabase Storage or AWS S3 (Version 2 receipts)  
\- Vercel (hosting, cron)  
\- Managed Postgres (Neon or Supabase) with point-in-time recovery  
\- Sentry (error tracking)

No payment gateway. No WhatsApp Business API. No NIN registry. No credit bureau. No email provider. No analytics SDK.

\#\#\# 8.5 Environment and Configuration

\*\*Environments:\*\* Development, Preview, Production. Preview for UAT.

\*\*Secrets in Vercel:\*\*  
\- \`DATABASE\_URL\`  
\- \`NEXTAUTH\_SECRET\`  
\- \`SMS\_API\_KEY\`  
\- \`S3\_ACCESS\_KEY\`  
\- \`S3\_SECRET\_KEY\`  
\- \`NIN\_ENCRYPTION\_KEY\`  
\- \`PHONE\_ENCRYPTION\_KEY\`  
\- \`CRON\_SECRET\`  
\- \`SENTRY\_DSN\`

\*\*Settings table:\*\*  
\- freshness\_window default 24 hours  
\- down\_payment\_min 70 percent  
\- down\_payment\_max 80 percent  
\- window\_days 30  
\- expiry\_hours 24  
\- last\_cron\_heartbeat\_at

\*\*Key rotation:\*\* Owner triggers. Runs during off-hours. Idempotent script. Rows re-encrypted counted and logged in AuditLog.

\---

\#\# 9\. Non-Functional Requirements

\#\#\# 9.1 Performance

\- Home and Device Detail: First Contentful Paint under 1.8 seconds on 3G mid-range Android.  
\- OTP screens: under 3 seconds because they depend on SMS provider latency.  
\- API P95: read endpoints under 500ms. Write endpoints with transactions under 1 second.  
\- Inventory listing: up to 500 devices without pagination degradation.  
\- Audit log: paginated at 50 rows. Queries under 1 second.

\#\#\# 9.2 Reliability and Availability

\- \*\*Uptime:\*\* 99 percent during 09:00 to 20:15 WAT Monday to Saturday. Covers the default cron window.  
\- \*\*Cron reliability:\*\* Application expiry every 5 minutes. Default cron at 20:00 WAT daily. Heartbeat written on each run. Heartbeat check runs 15 minutes after each cron.  
\- \*\*Idempotency:\*\* Duplicate phone plus device plus pending application in last 24 hours rejected.  
\- \*\*Transaction integrity:\*\* Prisma transactions. Rollback on failure.

\#\#\# 9.3 Security

\- \*\*Password storage:\*\* bcrypt cost 12\.  
\- \*\*Session:\*\* Database table. HttpOnly, Secure, SameSite=Lax cookies.  
\- \*\*OTP:\*\* 6 digits. 10-minute expiry. 3 attempts per OTP. 10 OTP requests per phone per hour. Store Worker in-person fallback available.  
\- \*\*Rate limits:\*\* Public endpoints 200 requests per minute per IP. Authenticated endpoints 30 requests per minute per user. OTP and login 5 requests per minute per user.  
\- \*\*NIN and phone encryption:\*\* AES-256 at rest. Keys in environment variables. Decryption for Owner or Co-owner. NIN masked for Worker.  
\- \*\*Role checks:\*\* Server-side. Never trust client-supplied role.  
\- \*\*Same-user rule:\*\* Enforced inside final-approve transaction.  
\- \*\*IP logging:\*\* Recorded on verification and final approval. Collision alerts Owner.  
\- \*\*Audit log immutability:\*\* Insert-only at DB permission level.  
\- \*\*Password reset:\*\* 24-hour account lock. Previous sessions invalidated. Owner or Co-owner unlocks after in-person verification. All resets logged.  
\- \*\*Receipt storage:\*\* Signed URLs with 15-minute expiry (Version 2). Access logged.  
\- \*\*CSRF:\*\* Token-based on all state-changing endpoints.

\#\#\# 9.4 Accessibility

\- WCAG 2.1 AA for customer flows.  
\- Contrast 4.5 to 1 body text, 3 to 1 large text and UI.  
\- Keyboard reachable.  
\- Visible labels, not placeholder-only.  
\- Inline errors associated via aria-describedby.  
\- Battery life and price announce as distinct labeled values with equal reading order weight.

\#\#\# 9.5 Browser and Device Support

\- Mobile: last two major Chrome on Android. Last two major Safari on iOS.  
\- Desktop: last two major Chrome, Firefox, Safari, Edge.  
\- No IE. No Opera Mini. No ES2020-unsupported browsers.  
\- Customer flows optimized for 360px. Worker and Owner flows for 1024px.

\#\#\# 9.6 Data Integrity and Concurrency

\- \*\*Stock reservation:\*\* ACID increment prevents double reservation.  
\- \*\*Price lock:\*\* Read inside same transaction as application insert.  
\- \*\*Final approval:\*\* Same-user check inside transaction.  
\- \*\*Default transition:\*\* Idempotent. Running cron twice does not double-apply.  
\- \*\*Overpayment block:\*\* Balance checked inside transaction.

\---

\#\# 10\. Role Permission Matrix

\| Resource or Action \| Visitor \| Customer \| Store Worker \| Owner \| Co-owner \|  
\|---\|---\|---\|---\|---\|---\|  
\| Browse inventory \| Yes \| Yes \| Yes \| Yes \| Yes \|  
\| Filter devices \| Yes \| Yes \| Yes \| Yes \| Yes \|  
\| View device specs \| Yes \| Yes \| Yes \| Yes \| Yes \|  
\| Use calculator \| Yes \| Yes \| Yes \| Yes \| Yes \|  
\| Register \| Yes \| No \| No \| No \| No \|  
\| Submit application \| No \| Yes \| No \| No \| No \|  
\| Accept agreement with OTP \| No \| Yes \| No \| No \| No \|  
\| View own application \| No \| Yes \| No \| No \| No \|  
\| View own contract \| No \| Yes \| No \| No \| No \|  
\| Submit deletion request \| No \| Yes \| No \| No \| No \|  
\| View all applications \| No \| No \| No \| Yes \| Yes \|  
\| Approve for verification \| No \| No \| No \| Yes \| Yes \|  
\| Reject application \| No \| No \| No \| Yes \| Yes \|  
\| Final approve \| No \| No \| No \| Yes if not verifier \| Yes if not verifier \|  
\| Verify down payment \| No \| No \| Yes \| No \| No \|  
\| Record balance payment \| No \| No \| Yes \| No \| No \|  
\| Record settlement payment \| No \| No \| Yes \| No \| No \|  
\| Send WhatsApp reminder \| No \| No \| Yes \| No \| No \|  
\| Update inventory \| No \| No \| Yes (submit) \| No \| No \|  
\| Approve inventory \| No \| No \| No \| Yes \| Yes \|  
\| Adjust exchange rate \| No \| No \| No \| Yes \| Yes \|  
\| Resolve default \| No \| No \| No \| Yes \| Yes \|  
\| Review deletion requests \| No \| No \| No \| Yes \| Yes \|  
\| View audit log \| No \| No \| No \| Yes \| Yes \|  
\| View metrics \| No \| No \| No \| Yes \| Yes \|  
\| View full NIN \| No \| No \| Masked only \| Yes \| Yes \|  
\| View receipt images \| No \| No \| Uploads only \| Yes \| Yes \|

\*\*Hard constraints in code:\*\*  
\- Same-user rule blocks final approval if user\_ids match.  
\- Customer cannot see other customers' data.  
\- Worker cannot reach \`/api/admin/\*\`.  
\- Account sharing prohibited. IP collision on verify and approve alerts Owner.

\---

\#\# 11\. Notification Matrix

Version 1 sends OTP SMS and manual WhatsApp only.

\| Trigger \| Recipient \| Channel \| Template \| Triggered By \|  
\|---\|---\|---\|---\|---\|  
\| Registration \| Visitor \| SMS OTP \| OTP with 10-minute expiry \| System \|  
\| Application submitted \| Customer \| In-platform status only \| Application Pending screen \| System \|  
\| Application rejected \| Customer \| In-platform status only \| Rejected with reason \| Owner or Co-owner \|  
\| Application expired \| Customer \| In-platform status only \| Expired with reapply \| Cron \|  
\| Approved for payment verification \| Customer \| In-platform plus manual WhatsApp \| "Approved for payment verification. Visit Shop ATF 03." \| Owner or Co-owner action, Worker sends \|  
\| Down payment verified \| Customer \| In-platform plus manual WhatsApp \| "Payment verified. Accept your agreement." \| Worker action \|  
\| Agreement acceptance OTP \| Customer \| SMS OTP \| OTP with 10-minute expiry \| System at acceptance \|  
\| Contract activated \| Customer \| Manual WhatsApp \| Template A.2 \| Worker action \|  
\| Reminder 7 days before due \| Customer \| Manual WhatsApp \| Template A.1 T-7 \| Worker \|  
\| Reminder 3 days before due \| Customer \| Manual WhatsApp \| Template A.1 T-3 \| Worker \|  
\| Reminder 1 day before due \| Customer \| Manual WhatsApp \| Template A.1 T-1 \| Worker \|  
\| Reminder on due date \| Customer \| Manual WhatsApp \| Template A.1 T-0 \| Worker \|  
\| Reminder 1 day after due \| Customer \| Manual WhatsApp \| Template A.1 T+1 \| Worker \|  
\| Contract completed \| Customer \| In-platform only \| Completed screen \| Worker action \|  
\| Contract defaulted \| Customer \| In-platform only \| Defaulted screen \| Cron \|  
\| Default resolved \| Customer \| In-platform only \| Resolved screen \| Owner or Co-owner \|  
\| Deletion request decided \| Customer \| In-platform only \| Account Settings screen \| Owner or Co-owner \|  
\| Final approval delayed past 24h \| Owner and Co-owner \| In-app dashboard alert \| Awaiting Final Approval alert \| Cron \|  
\| Customer acceptance missing past 24h \| Owner and Co-owner \| In-app dashboard alert \| Awaiting Customer Acceptance alert \| Cron \|  
\| Cron heartbeat stale \| Owner and Co-owner \| In-app dashboard alert \| Cron health warning \| Heartbeat checker \|  
\| IP collision on verify and approve \| Owner and Co-owner \| In-app dashboard alert \| IP collision warning \| System on final approval \|

\*\*Not in Version 1:\*\* automated WhatsApp, email, push, SMS beyond OTP.

\---

\#\# 12\. Build Plan for 1-Week Delivery

Assumes one full-time engineer. Two engineers parallelize Day 2 and Day 3\.

\#\#\# Day 1: Foundation

\- Repo. Next.js 14, TypeScript, Tailwind, Prisma.  
\- Postgres. Prisma schema for all tables.  
\- Auth: register, login, OTP verify, logout, forgot password, reset password with lock.  
\- Role middleware.  
\- Settings seeded.  
\- AuditLog helper.  
\- Deploy to Preview.

\#\#\# Day 2: Public Inventory and Calculator

\- Home and Inventory Listing with filters.  
\- Device Detail with battery-equals-price.  
\- Calculator.  
\- Dynamic price display.  
\- Empty, loading, error states.  
\- Seed 25 devices.  
\- Tests written alongside.  
\- Deploy to Preview.

\#\#\# Day 3: Application Submission and Expiry

\- Apply form with inline validation (no OTP at submission).  
\- Atomic submission: lock, reserve, insert, audit.  
\- Revalidation and price change notice.  
\- Out of stock and stale price blocks.  
\- Application Pending with countdown.  
\- Cron for pending expiry.  
\- Tests written alongside.  
\- Deploy to Preview.

\#\#\# Day 4: Approval, OTP on Acceptance, Activation

\- Owner New Applications queue.  
\- Review with customer details, NIN, guarantor.  
\- Approve and reject flows.  
\- Worker Payments to Verify queue.  
\- Down payment verification. IP logged.  
\- Manual WhatsApp send for "Approved for verification" and "Payment verified. Accept agreement."  
\- Agreement acceptance with OTP.  
\- Awaiting Final Approval queue. Same-user rule and IP collision alert.  
\- Contract activation. Serial recorded. 30-day countdown. Confirmation WhatsApp.  
\- Tests written alongside.  
\- Deploy to Preview.

\#\#\# Day 5: Balance, Defaults, Deletions, Launch

\- Balance payment recording.  
\- Settlement payment recording.  
\- Reminder checklist with manual sends.  
\- Default cron at 20:00 WAT with heartbeat. Administrative default flag. Platform block.  
\- Resolve default flow.  
\- Deletion request flow.  
\- Simplified Success Metrics page (numbers only, no charts).  
\- Simplified Audit Log view (raw table).  
\- Simplified Reserved Units view (text label only).  
\- UAT on Day 5 morning at Shop ATF 03 with Owner, one Worker, and Ahmed persona.  
\- Production deploy Day 5 afternoon. Rollback ready.

\*\*Buffer:\*\* Zero buffer. Any slip pushes launch. Trimmed scope in Section 6 protects the timeline. If Day 3 runs long, defer OTP on acceptance to Day 4 morning. If Day 5 runs long, defer Success Metrics page to Version 1.1.

\---

\#\# 13\. Testing Strategy

\#\#\# 13.1 Automated Tests

\*\*Unit tests:\*\*  
\- Down payment rejects 69.9 percent and accepts 70.0 and 80.0. Rejects 80.1.  
\- NIN validator rejects non-11-digit strings.  
\- Nigerian phone validator accepts \+234, 0, 234\.  
\- 30-day default returns 19:59 WAT on day 30 for any activation timestamp.  
\- Same-user rule blocks when user\_ids match.  
\- Overpayment block rejects amounts greater than remaining balance.  
\- Available stock equals stock\_count minus reserved\_count.  
\- Price freshness returns stale when multiplier changed.  
\- ConsentRecord written on registration for terms and WhatsApp.

\*\*Integration tests (test Postgres):\*\*  
\- Application submission writes all four records in one transaction.  
\- Expiry decrements reserved\_count and releases lock.  
\- Contract activation sets due\_date, serial, audit.  
\- Default cron transitions at 19:59 WAT day 30\.  
\- Deletion anonymizes fields and pseudonymizes audit actor\_id.  
\- Worker cannot reach \`/api/admin/\*\`. Returns 403\.  
\- Customer cannot view another customer's application. Returns 404\.  
\- OTP required for agreement acceptance. Missing OTP blocks.  
\- Password reset locks account 24 hours.

\*\*Concurrency tests:\*\*  
\- Two simultaneous applications for last unit. One succeeds, one fails Out of Stock.  
\- Two simultaneous final-approve from same user. First succeeds, second returns 400\.  
\- Two simultaneous final-approve from different users. One succeeds, one fails Approved by another user.  
\- Two simultaneous balance payments that would overpay. One succeeds, one fails overpayment block.

\#\#\# 13.2 Manual Tests

\*\*UAT at Shop ATF 03:\*\*  
\- Ahmed persona full journey.  
\- Store Worker verification, reminder send, balance recording.  
\- Owner review, approval, exchange rate change, default resolution, deletion review.

\*\*Edge case walkthrough:\*\* Appendix C every line exercised once.

\*\*Accessibility:\*\* Keyboard-only through customer flows. Screen reader on Device Detail and Apply form.

\*\*Device testing:\*\* One low-end Android on 3G. One iPhone. One desktop Chrome.

\#\#\# 13.3 Test Data

Seed script: one Owner, one Co-owner, two Store Workers, three Customers, 25 devices, one Defaulted contract for UAT. Seed never runs in Production unless flagged.

\#\#\# 13.4 Security Tests

\- XSS: input in full name and personal details. Verify escaped on render.  
\- SQL injection: filters on brand and category. Verify parameterized.  
\- IDOR: Customer A accessing Customer B's application via \`/api/applications/:id\`. Returns 404\.  
\- Session fixation: session token regenerated on login.  
\- CSRF: state-changing requests without token rejected.  
\- Rate limits: verify 200 per minute per IP public, 30 per minute authenticated, 5 per minute on OTP and login.  
\- Password reset lockout.

\---

\#\# 14\. Deployment and Operations

\#\#\# 14.1 Environments

\- Development: local Postgres.  
\- Preview: per PR. Preview Postgres. UAT.  
\- Production: main branch. Production Postgres.

\#\#\# 14.2 Deployment Process

1\. Push to feature branch.  
2\. Vercel builds Preview.  
3\. Automated tests run.  
4\. PR reviewed.  
5\. Merge to main triggers Production build.  
6\. Prisma migrations run before new code serves traffic. Migration timeouts documented. If a migration exceeds 10 minutes, deploy aborts and rollback triggers.  
7\. Sentry release created. Smoke tests run against Production.  
8\. If smoke tests fail, rollback to prior Vercel deploy. Database rollback only if migration was additive.

\#\#\# 14.3 Cron Jobs

\- \`expire-applications\` every 5 minutes. Secret header. Idempotent. Writes heartbeat.  
\- \`default-contracts\` at 20:00 WAT daily. Secret header. Idempotent. Writes heartbeat.  
\- Heartbeat checker 15 minutes after each cron. Missing heartbeat triggers in-app Owner alert.  
\- Cron failure triggers Sentry alert to in-app dashboard banner. No email.

\#\#\# 14.4 Rollback

\- Vercel instant rollback.  
\- Migrations additive only. No destructive migrations. No column drops. No type narrowing. No constraint additions that reject existing rows.  
\- Encryption key rotation is separate maintenance runbook.

\#\#\# 14.5 Runbook for Common Operations

\- \*\*Add Owner or Co-owner:\*\* Owner invites in Settings. Role assigned in DB by Product Lead. Logged in AuditLog.  
\- \*\*Add Store Worker:\*\* Owner creates account. Role assigned in DB. Logged.  
\- \*\*Change encryption keys:\*\* Owner triggers during off-hours. Idempotent script. Row count logged.  
\- \*\*Reset Worker verification permissions:\*\* Owner disables account. Status Suspended. Existing transactions audited. New verifications blocked.  
\- \*\*Unlock password-reset account:\*\* Owner or Co-owner verifies in person at Shop ATF 03\. Unlocks. Logged.

\---

\#\# 15\. Monitoring and Observability

\#\#\# 15.1 What Is Monitored

\- Availability: Vercel uptime on Home and API health.  
\- Errors: Sentry captures 5xx.  
\- Performance: P50, P95, P99 API times.  
\- Database: query latency and connections.  
\- Cron health: heartbeat to Settings. Heartbeat check 15 minutes after each cron. Warning banner in Owner Dashboard if heartbeat stale.  
\- Business metrics: five Success Metrics from Section 1.8 in Owner Dashboard.

\#\#\# 15.2 What Is Not Monitored

\- Session replay. Heatmaps. A/B testing. Custom event funnels.

\#\#\# 15.3 Alerting

\- Sentry alert to in-app Owner and Co-owner dashboard banner on 5xx rate above 1 percent over 5 minutes.  
\- Sentry alert on cron failure.  
\- Vercel alert on deploy failure to in-app dashboard banner.  
\- No email alerts. Manual WhatsApp escalation is not automated in Version 1\.

\---

\#\# 16\. Data Seeding and Migration

\#\#\# 16.1 Seed Data for Launch

\- Users: one Owner, one Co-owner, two Store Workers. Temporary passwords issued in person at Shop ATF 03\. Forced change on first login. AuditLog entry per issue.  
\- Devices: 20 to 30 across brands. Brand, category, performance tier, battery life, model.  
\- Inventory: Stock and base price entered by Worker and approved by Owner before launch.  
\- Settings: freshness\_window 24 hours. Down payment min 70\. Max 80\. Expiry 24 hours. Window 30 days.

\#\#\# 16.2 Version 2 Migration Notes

\- DownPaymentTransaction and BalancePaymentTransaction fields support Version 2 device locking and credit scoring without schema change.  
\- Agreement.device\_serial is tie key for Version 2 remote locking.  
\- CustomerProfile.guarantor\_name and guarantor\_phone collected but unverified. Version 2 adds verification.  
\- ConsentRecord exists from Day 1 so no backfill needed.

\---

\#\# 17\. Backup and Recovery

\#\#\# 17.1 Backup

\- Postgres point-in-time recovery with 5-minute RPO.  
\- Retention: 90 days.  
\- Backup location: Managed by Neon or Supabase. Encrypted at rest.  
\- Receipt images (Version 2): 90-day retention. Payment logs in Postgres are system of record.

\#\#\# 17.2 Recovery

\- \*\*RTO:\*\* 4 hours for full restore.  
\- \*\*RPO:\*\* 5 minutes via PITR.  
\- \*\*Restore procedure:\*\* Documented runbook. Owner or Product Lead triggers. Post-restore verification:  
  \- Row counts on User, PartPaymentApplication, Agreement, DownPaymentTransaction match pre-incident plus expected writes.  
  \- Spot-check 10 most recent DownPaymentTransaction and BalancePaymentTransaction rows against WhatsAppReminderLog or AuditLog references.  
\- \*\*Audit log:\*\* Restored with database. Never partially restored.

\#\#\# 17.3 Incident Response

\- \*\*Who:\*\* Owner or Product Lead.  
\- \*\*When:\*\* Any incident affecting payment record, contract status, or authentication.  
\- \*\*Steps:\*\* Contain, restore, verify, notify affected customers via in-platform and manual WhatsApp, log in AuditLog under \`INCIDENT\` action type.  
\- \*\*Post-incident:\*\* Written summary within 72 hours. Root cause. Correction added to Section 4 or 7\.

\---

\#\# Appendix A: Message Templates

\#\#\# A.1 WhatsApp Manual Reminder Templates

\*\*T-7:\*\* "Hello \[Customer Name\], this is DG Tech Store. Your balance for \[Device Brand Model\] is \[Amount\]. Due date is \[Date\]. Visit Shop ATF 03 or call us to complete payment."

\*\*T-3:\*\* "Hello \[Customer Name\], this is DG Tech Store. Your balance of \[Amount\] for \[Device Brand Model\] is due in 3 days on \[Date\]. Visit Shop ATF 03 or call us."

\*\*T-1:\*\* "Hello \[Customer Name\], this is DG Tech Store. Your balance of \[Amount\] for \[Device Brand Model\] is due tomorrow \[Date\]. Visit Shop ATF 03 or call us."

\*\*T-0:\*\* "Hello \[Customer Name\], this is DG Tech Store. Your balance of \[Amount\] for \[Device Brand Model\] is due today. Visit Shop ATF 03 or call us."

\*\*T+1:\*\* "Hello \[Customer Name\], this is DG Tech Store. Your balance of \[Amount\] for \[Device Brand Model\] is now overdue. Your contract status will change to Defaulted. Please visit Shop ATF 03 or call us immediately."

\#\#\# A.2 Contract Confirmation

"Hello \[Customer Name\], your DG Tech Store contract is now active. Device: \[Device Brand Model\]. Remaining balance: \[Amount\]. Due date: \[Date\]. 30-day window starts today. Visit Shop ATF 03 for any questions."

\#\#\# A.3 Confirm Current Price Prefilled Message

"Hi DG Tech Store, I want to confirm the current price for \[Device Brand Model\]. My name is \[Customer Name if logged in\]."

\#\#\# A.4 Agreement Acceptance Prompt

"Your payment has been verified. Please read and accept your agreement to activate your contract."

\#\#\# A.5 Payment Verified Notification

"Payment verified. Accept your agreement to activate contract."

\#\#\# A.6 Approved for Payment Verification

"Your application has been approved for payment verification. Please visit Shop ATF 03 to complete your down payment."

\---

\#\# Appendix B: Error, Empty, and Loading States

\#\#\# B.1 Home and Inventory Listing

\- Empty: "No devices match your filters. Clear filters to see all devices."  
\- Loading: skeleton cards.  
\- Error: "Could not load devices. Check connection and try again."

\#\#\# B.2 Device Detail

\- Out of stock: "Out of Stock. Confirm Current Price via WhatsApp."  
\- Stale price: "Price may have changed. Confirm Current Price via WhatsApp."  
\- Loading: skeleton.  
\- Error: "Could not load device. Refresh to try again."

\#\#\# B.3 Apply Form

\- NIN error: "NIN must be exactly 11 numeric digits."  
\- Phone error: "Enter a valid Nigerian phone number."  
\- Down payment error: "Down payment must be between \[70% amount\] and \[80% amount\]."  
\- Price change notice: "The price has changed. Old price: \[X\]. New price: \[Y\]. New range: \[A\] to \[B\]. Confirm to proceed."  
\- Out of stock block: "Out of Stock. Confirm Current Price via WhatsApp."  
\- Stale price block: "Price may have changed. Confirm Current Price via WhatsApp."  
\- Error: "Could not submit application. Refresh and try again."

\#\#\# B.4 Application Status

\- Expired: "Application Expired. Reapply to try again."  
\- Rejected: "Application Rejected. Reason: \[Reason\]."  
\- Pending: "Application Pending. Expires in \[countdown\]."  
\- Approved for verification: "Approved for payment verification. Visit Shop ATF 03."  
\- Awaiting acceptance: "Payment verified. Accept your agreement to activate contract."  
\- Awaiting final approval: "Awaiting final approval from store management."  
\- Active: "Contract Active. \[Countdown\] to due."  
\- Completed: "Contract Completed. Thank you."  
\- Defaulted: "Contract Defaulted. Visit Shop ATF 03 to resolve."

\#\#\# B.5 Contract Detail

\- Loading: skeleton.  
\- Error: "Could not load contract. Refresh to try again."

\#\#\# B.6 Agreement Acceptance

\- OTP not received: "Trouble receiving OTP? Visit Shop ATF 03 for in-person verification."  
\- OTP error: "Incorrect OTP. \[Attempts remaining\] attempts remaining."  
\- Expired OTP: "OTP expired. Request a new one."

\#\#\# B.7 Store Worker Screens

\- Empty queue: "No items in this queue."  
\- Loading: skeleton rows.  
\- Error: "Could not load queue. Refresh to try again."  
\- Overpayment: "Amount exceeds remaining balance."  
\- Same-user block: "Final approval must be by a different user than the verifier."

\#\#\# B.8 Owner and Co-owner Screens

\- Empty queue: "No items in this queue."  
\- Loading: skeleton rows.  
\- Error: "Could not load queue. Refresh to try again."  
\- Same-user block: "Final approval must be by a different user than the verifier."  
\- Missing acceptance: "Customer has not accepted the agreement. Final approval blocked."  
\- IP collision alert: "Same IP performed verification and final approval on this application. Review before further approvals."  
\- Cron heartbeat warning: "Cron has not run in 15 minutes. Check system health."

\---

\#\# Appendix C: Edge Case Catalog

\| Edge Case \| Handling \|  
\|---\|---\|  
\| Customer loses phone before OTP \| In-person identity check at Shop ATF 03, Worker triggers OTP resend with AuditLog \|  
\| Owner and Co-owner both unavailable \| In-app alert if approval delayed past 24 hours \|  
\| Owner is also the only Store Worker \| Final approval blocked by same-user rule \|  
\| Device damaged before pickup \| Timer paused, Owner resolution \|  
\| Device sold while reserved \| Reservation flag on Worker dashboard, physical tag, block in-store sale \|  
\| Customer submits fake NIN \| Format check, manual review, guarantor record \|  
\| Customer overpays \| Blocked with error \|  
\| Customer underpays partially \| Recorded as partial, balance recalculated \|  
\| Public holiday \| Window does not extend \|  
\| Customer does not accept agreement \| Notify Owner and Co-owner after 24 hours \|  
\| Customer requests cancel pending application \| No self-cancel. Wait for expiry or ask Worker to notify Owner \|  
\| Customer requests 30-day extension \| Not allowed. Strict window \|  
\| Customer requests informal deletion \| Refused with direction to Account Settings \|  
\| Deletion with active contract \| Rejected, retention required \|  
\| Deletion with defaulted contract \| Rejected, retention required \|  
\| Price changes on Apply form \| Revalidation, price change notice \|  
\| WhatsApp not installed \| Clipboard fallback or in-person \|  
\| Worker unavailable for down payment \| Stays in queue, no auto-expiry \|  
\| Device returned after Completed \| Not supported \|  
\| Customer dies or incapacitated \| Manual Owner resolution \|  
\| Same IP on verify and approve \| Owner alert, manual review \|  
\| Password reset by thief \| 24-hour account lock, Owner unlocks after in-person \|  
\| Cron missed \| Heartbeat check 15 min after cron, Owner alert \|  
\| Two simultaneous applications for last unit \| One succeeds, one fails Out of Stock \|  
\| Two simultaneous final approvals \| One succeeds, one fails \|

\---

\#\# Appendix D: Open Questions

1\. Which SMS provider is confirmed: Termii or Africa's Talking?  
2\. Exact retention period for Completed contract data.  
3\. Whether the down payment minimum varies per device category.  
4\. Physical tag format for reserved units at Shop ATF 03\.  
5\. Storage and custody of the pseudonymous ID mapping.  
6\. Worker permission reset runbook sign-off.  
7\. Maximum pending applications per customer.

\---

\#\# Appendix E: Glossary

\- \*\*Available stock:\*\* stock\_count minus reserved\_count.  
\- \*\*Locked price:\*\* Device price at valid application submission.  
\- \*\*Price freshness:\*\* Fresh when multiplier unchanged and last update within window.  
\- \*\*Pending application expiry:\*\* 24 hours from submission.  
\- \*\*Settled:\*\* Full remaining balance recorded as paid.  
\- \*\*Administrative default flag:\*\* Record marking device serial and contract as Defaulted. Does not recover the device.  
\- \*\*Same-user rule:\*\* Final approver cannot be the verifier.  
\- \*\*WAT:\*\* West Africa Time, UTC+1.  
\- \*\*IP collision:\*\* Same IP address recorded on both verification and final approval for the same application.

\---

\#\# Appendix F: Notification Channel Summary

\| Channel \| Version 1 Use \|  
\|---\|---\|  
\| SMS \| OTP at registration and OTP at agreement acceptance only \|  
\| In-platform \| All status changes visible on dashboard \|  
\| Manual WhatsApp \| Approved for verification, Payment verified, Contract confirmation, 5 balance reminders \|  
\| In-app dashboard alert \| Owner and Co-owner only: final approval delay, acceptance delay, cron heartbeat stale, IP collision \|  
\| Email \| Not used \|  
\| Push \| Not used \|

\---

\#\# Appendix G: Day 0 Decisions Required Before Build

These must be answered on Day 0 or the 1-week plan slips.

1\. SMS provider confirmed: Termii or Africa's Talking.  
2\. Retention period for Completed contract data.  
3\. Down payment minimum per category or global.  
4\. Physical tag format at Shop ATF 03\.  
5\. Custody of pseudonymous ID mapping.  
6\. Worker permission reset runbook sign-off.  
7\. Maximum pending applications per customer.

\---

