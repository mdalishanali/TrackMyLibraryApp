# PostHog Analytics Implementation

## Overview
Comprehensive event tracking across the Track My Library app using PostHog with session replay capabilities.

## Configuration
- **API Key**: `phc_dltVo9iYK5gTfaYXBpcLEiKpaRRnvUHQL7cWDZLjMej`
- **Host**: `https://us.i.posthog.com`
- **Session Replay**: Enabled
- **Privacy**: All text inputs and images are masked
- **Network Telemetry**: Enabled (iOS only)

## Events Tracked

### Authentication Events
1. **user_logged_in**
   - Triggered: When user successfully logs in
   - Properties:
     - `user_id`: User identifier
     - `email`: User email
     - `library_name`: Library/business name

2. **user_signed_up**
   - Triggered: When new user completes registration
   - Properties:
     - `user_id`: New user identifier
     - `email`: User email
     - `library_name`: Library/business name
     - `platform`: 'mobile'

3. **user_logged_out**
   - Triggered: When user confirms logout action
   - Properties: None

### Student Management Events
4. **student_created**
   - Triggered: When a new student is added
   - Properties:
     - `student_name`: Student's full name
     - `has_seat`: Boolean indicating seat assignment
     - `shift`: Shift name or 'none'
     - `fees`: Monthly fee amount
     - `has_profile_picture`: Boolean

5. **student_updated**
   - Triggered: When student details are modified
   - Properties:
     - `student_id`: Student identifier
     - `fields_updated`: Array of field names changed

6. **student_deleted**
   - Triggered: When a student is removed
   - Properties:
     - `student_id`: Student identifier

7. **student_view_clicked**
   - Triggered: When user clicks View button on student card
   - Properties: None

8. **student_edit_clicked**
   - Triggered: When user clicks Edit button on student card
   - Properties: None

9. **student_pay_clicked**
   - Triggered: When user clicks Pay button on student card
   - Properties: None

10. **student_delete_clicked**
    - Triggered: When user clicks Delete button on student card
    - Properties: None

### Payment Events
7. **payment_recorded**
   - Triggered: When a new payment is recorded
   - Properties:
     - `amount`: Payment amount in rupees
     - `payment_mode`: 'cash', 'upi', or 'online'
     - `student_id`: Student identifier

8. **payment_updated**
   - Triggered: When payment details are modified
   - Properties:
     - `payment_id`: Payment identifier
     - `fields_updated`: Array of field names changed

9. **payment_deleted**
   - Triggered: When a payment record is removed
   - Properties:
     - `payment_id`: Payment identifier

### WhatsApp Events
10. **whatsapp_fee_reminder_sent**
    - Triggered: When fee reminder is sent via WhatsApp
    - Properties:
      - `student_id`: Student identifier

11. **whatsapp_receipt_sent**
    - Triggered: When payment receipt is sent via WhatsApp
    - Properties:
      - `payment_id`: Payment identifier

12. **whatsapp_template_sent**
    - Triggered: When a custom WhatsApp template is sent
    - Properties:
      - `student_id`: Student identifier
      - `template_type`: Type of template sent

### Onboarding Events
13. **library_setup_completed**
    - Triggered: When initial library setup is completed
    - Properties:
      - `total_seats`: Number of seats created
      - `monthly_fee`: Default monthly fee (if set)

### Seat Management Events
14. **seats_created**
    - Triggered: When new seats are created in bulk
    - Properties:
      - `floor`: Floor/section name
      - `seat_count`: Number of seats created

15. **seats_deleted**
    - Triggered: When seats are deleted in bulk
    - Properties:
      - `seat_count`: Number of seats deleted

### Screen View Events
16. **Login** (Screen View)
    - Triggered: When user navigates to Login screen
    - Automatically tracked via `useScreenView` hook

17. **Signup** (Screen View)
    - Triggered: When user navigates to Signup screen
    - Automatically tracked via `useScreenView` hook

18. **Forgot Password** (Screen View)
    - Triggered: When user navigates to Forgot Password screen
    - Automatically tracked via `useScreenView` hook

19. **Dashboard** (Screen View)
    - Triggered: When user navigates to Dashboard screen
    - Automatically tracked via `useScreenView` hook

20. **Students** (Screen View)
    - Triggered: When user navigates to Students screen
    - Automatically tracked via `useScreenView` hook

21. **Payments** (Screen View)
    - Triggered: When user navigates to Payments screen
    - Automatically tracked via `useScreenView` hook

22. **Seats** (Screen View)
    - Triggered: When user navigates to Seats screen
    - Automatically tracked via `useScreenView` hook

23. **Analytics** (Screen View)
    - Triggered: When user navigates to Analytics screen
    - Automatically tracked via `useScreenView` hook

24. **Settings** (Screen View)
    - Triggered: When user navigates to Settings screen
    - Automatically tracked via `useScreenView` hook

### Profile & Account Events
25. **profile_updated**
    - Triggered: When user updates their profile or library details
    - Properties:
      - `fields_updated`: Array of field names changed

26. **account_deleted**
    - Triggered: When user permanently deletes their account
    - Properties: None
    - Note: Also calls `posthog.reset()` to clear user identity

### Expense Management Events
27. **expense_created**
    - Triggered: When a new expense is recorded
    - Properties:
      - `category`: Expense category (Rent, Salary, etc.)
      - `amount`: Expense amount

28. **expense_updated**
    - Triggered: When expense details are modified
    - Properties:
      - `expense_id`: Expense identifier
      - `category`: Updated category

29. **expense_deleted**
    - Triggered: When an expense record is removed
    - Properties:
      - `expense_id`: Expense identifier

### Subscription & Paywall Events
30. **paywall_viewed**
    - Triggered: When paywall is displayed to user
    - Properties:
      - `is_blocked`: Whether user is blocked from access
      - `trial_time_left`: Remaining trial time or 'none'

31. **package_selected**
    - Triggered: When user selects a subscription package
    - Properties:
      - `package_id`: Package identifier
      - `package_type`: Package type (ANNUAL, MONTHLY, etc.)
      - `price`: Package price

32. **purchase_button_clicked**
    - Triggered: When user clicks the purchase button
    - Properties:
      - `package_id`: Package identifier
      - `package_type`: Package type
      - `price`: Package price

33. **subscription_purchased**
    - Triggered: When subscription is successfully purchased
    - Properties:
      - `package_id`: Package identifier
      - `package_type`: Package type
      - `price`: Package price

34. **purchase_failed**
    - Triggered: When purchase attempt fails
    - Properties:
      - `package_id`: Package identifier
      - `error`: Error message

35. **purchase_cancelled**
    - Triggered: When user cancels purchase flow
    - Properties:
      - `package_id`: Package identifier

36. **restore_purchases_clicked**
    - Triggered: When user attempts to restore purchases
    - Properties:
      - `source`: Where action was triggered ('paywall' or 'settings')

37. **support_contacted**
    - Triggered: When user clicks support contact button
    - Properties:
      - `method`: Contact method ('whatsapp' or 'email')
      - `source`: Where action was triggered (e.g., 'paywall')

## Summary
**Total Events: 41** covering:
- Authentication (3)
- Student Management (7) - includes 4 button click events
- Payments (3)
- WhatsApp Communications (3)
- Onboarding (1)
- Seat Management (2)
- Screen Views (9)
- Profile & Account (2)
- Expense Management (3)
- Subscription & Paywall (8)

## User Identification
- PostHog `identify()` is called on:
  - Login success
  - Signup success
- User properties set:
  - `email`
  - `name`
  - `library_name`

## Session Replay Features
- **Masked by Default**:
  - All text inputs (except passwords which are always masked)
  - All images
- **Captured**:
  - Screen interactions
  - Button clicks
  - Navigation events
  - Network telemetry (iOS)
  - Application logs (Android)

## Implementation Files
- `/app/_layout.tsx` - PostHog Provider wrapper
- `/hooks/use-auth-mutations.ts` - Auth events
- `/hooks/use-students.ts` - Student CRUD events
- `/hooks/use-payments.ts` - Payment events
- `/hooks/use-whatsapp.ts` - WhatsApp events
- `/hooks/use-onboarding.ts` - Setup events
- `/hooks/use-seats.ts` - Seat management events
- `/hooks/use-profile.ts` - Profile & account events
- `/hooks/use-expenses.ts` - Expense tracking events
- `/hooks/use-screen-view.ts` - Screen tracking hook
- `/app/(tabs)/index.tsx` - Dashboard screen tracking
- `/app/(tabs)/students/index.tsx` - Students screen tracking
- `/app/(tabs)/payments.tsx` - Payments screen tracking
- `/app/(tabs)/seats.tsx` - Seats screen tracking
- `/app/(tabs)/analytics.tsx` - Analytics screen tracking
- `/app/(tabs)/settings.tsx` - Settings screen tracking + logout/restore
- `/app/(auth)/login.tsx` - Login screen tracking
- `/app/(auth)/signup.tsx` - Signup screen tracking
- `/app/(auth)/forgot-password.tsx` - Forgot Password screen tracking
- `/components/subscription/custom-paywall.tsx` - Paywall tracking
- `/components/students/StudentSummary.tsx` - Student button click tracking

## Next Steps to See Events
1. Build the app with native modules:
   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```
2. Use the app and perform actions
3. Events will appear in PostHog dashboard within ~30 seconds
4. Session replays will be available for review

## Privacy & Compliance
- All sensitive inputs are masked
- GDPR compliant with proper user identification
- Can be disabled per user if needed
- Session recordings can be paused programmatically
