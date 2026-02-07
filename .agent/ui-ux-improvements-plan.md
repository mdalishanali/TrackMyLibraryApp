# UI/UX Improvements Implementation Plan

## ✅ Features to Implement

### 1. Dark Mode Toggle
- [x] Theme system already exists (use-appearance.ts)
- [ ] Add theme toggle in Settings screen
- [ ] Add quick theme toggle in profile/settings
- [ ] Test dark mode across all screens

### 2. Offline Mode
- [ ] Enable React Query persistence
- [ ] Configure stale-while-revalidate strategy
- [ ] Add offline indicator in UI
- [ ] Cache images for offline viewing
- [ ] Show cached data when offline

### 3. Pull-to-Refresh Everywhere
- [x] Dashboard - Already has RefreshControl
- [x] Payments - Already has RefreshControl  
- [ ] Students list
- [ ] Seats view
- [ ] Settings/Profile screens

### 4. Skeleton Loaders
- [ ] Create reusable skeleton components
- [ ] Replace ActivityIndicator with skeletons on:
  - Dashboard (cards, metrics)
  - Students list
  - Payments list
  - Student detail page

### 5. Empty State Illustrations
- [ ] Generate custom empty state illustrations
- [ ] Replace current empty states with engaging visuals
- [ ] Add helpful CTAs to empty states
- [ ] Screens to update:
  - No students
  - No payments
  - No seats
  - Search no results

## Implementation Order
1. Skeleton Loaders (Quick win, big visual impact)
2. Pull-to-Refresh (Easy, improves UX)
3. Dark Mode Toggle UI (Already have backend)
4. Empty State Illustrations (Visual polish)
5. Offline Mode (More complex, do last)
