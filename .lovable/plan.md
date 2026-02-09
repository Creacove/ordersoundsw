
# Admin Beats Selection - Improved Randomization + Manual Picking

## Problem Summary
1. The randomization algorithm favors beats that have been in the system longer (pure random across 181 beats)
2. Newer beats rarely get selected as trending/featured
3. No option to manually select specific beats - only random refresh available

## Solution Overview
Add the ability for admins to manually select beats for Trending and Featured, while improving the randomization algorithm to give newer beats better odds.

---

## Technical Implementation

### 1. New Component: BeatSelector Dialog
Create a reusable beat selection dialog (similar to existing `ProducerSelector`) that allows searching and picking specific beats.

**File:** `src/components/admin/BeatSelector.tsx`

Features:
- Search beats by title, producer name, or genre
- Show beat cover, title, producer, upload date, and current status (trending/featured/weekly)
- Support single selection (for featured) or multi-selection (for trending - up to 5)
- Filter options: show newest first, filter by genre

---

### 2. Update BeatsManagement Component
Modify `src/components/admin/BeatsManagement.tsx` to add:
- "Select Manually" button next to each "Refresh" button for Trending and Featured sections
- Current selection preview showing which beats are currently trending/featured with option to view them

---

### 3. Improve Randomization - Weighted Algorithm
Update the SQL function to weight newer beats more heavily.

**New SQL Function:** `get_weighted_random_beats`

Algorithm:
- Beats uploaded in last 30 days: 3x weight
- Beats uploaded in last 90 days: 2x weight  
- Older beats: 1x weight
- This ensures newer content gets more exposure while still including catalog beats

```text
Weight Calculation:
+------------------+--------+
| Upload Age       | Weight |
+------------------+--------+
| < 30 days        |   3x   |
| 30-90 days       |   2x   |
| > 90 days        |   1x   |
+------------------+--------+
```

---

### 4. Update Edge Function
Modify `supabase/functions/admin-operations/index.ts` to support:
- New operation: `set_trending_beats` with specific beat IDs
- New operation: `set_featured_beat` with specific beat ID  
- Update existing refresh operations to use weighted randomization

---

### 5. Update Admin Hook
Modify `src/hooks/admin/useAdminOperations.ts` to add:
- `setTrendingBeats(beatIds: string[])` - Set specific beats as trending
- `setFeaturedBeat(beatId: string)` - Set specific beat as featured
- `fetchCurrentTrending()` - Get current trending beats for display
- `fetchCurrentFeatured()` - Get current featured beat for display

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/admin/BeatSelector.tsx` | Create | New beat selection dialog |
| `src/components/admin/BeatsManagement.tsx` | Modify | Add manual selection UI |
| `src/hooks/admin/useAdminOperations.ts` | Modify | Add manual selection functions |
| `supabase/functions/admin-operations/index.ts` | Modify | Handle manual beat selection |
| New migration | Create | Add weighted random function |

---

## UI Flow

### Trending Beats Section
```text
Current: 5 trending beats shown
[Refresh Random] [Select Manually]
                      |
                      v
               BeatSelector Dialog
               - Multi-select up to 5 beats
               - Search/filter functionality
               - Shows current trending status
               - [Confirm Selection] button
```

### Featured Beat Section  
```text
Current: 1 featured beat shown
[Refresh Random] [Select Manually]
                      |
                      v
               BeatSelector Dialog
               - Single-select mode
               - Search/filter functionality
               - [Set as Featured] button
```

---

## Changes Summary

1. **Database**: Add `get_weighted_random_beats` function with recency weighting
2. **Edge Function**: Add `set_trending_beats` and `set_featured_beat` operations
3. **Frontend Hook**: Add manual selection methods
4. **UI Component**: Create `BeatSelector` dialog with search and multi-select
5. **Admin Page**: Add "Select Manually" buttons and current selection preview

No changes to the public-facing app or existing functionality - this only adds new capabilities to the admin dashboard.
