# Task: Fix Student Movement & Departure Management Feature

## Summary of All Changes

### 1. Fixed API `/api/movements/[id]/route.ts`
- **Data flattening**: Added `flattenMovement()` helper function that flattens nested Prisma data (student.user.name, student.room.hostel.name) into the format expected by the frontend `MovementType` interface.
- **GET handler**: Now returns `{ movement: flatMovement }` instead of `{ movement }` with nested data.
- **PUT handler**: Now returns `{ movement: flatMovement }` after update, consistent with the GET handler.
- **Out status notification**: Added notification creation when status is changed to "Out", sending a message to the student confirming their departure with expected return date.

### 2. Fixed API `/api/movements/route.ts`
- **Date validation**: In POST handler, added validation that `expectedReturnDate > departureDate`, returning 400 if not.
- **Stats currentlyOutside fix**: Moved `currentlyOutside` computation AFTER the overdue auto-marking loop, so movements that were just changed from "Out" to "Late Return" are no longer counted as "outside".
- **POST response flattening**: Added flattening of the created movement response for consistency.

### 3. Fixed AdminMovements component in `admin-portal.tsx`
- **User prop**: Updated component signature to accept `user: UserType` and updated the call site (line ~204) to pass `user={user}`.
- **Mark as Out button**: Added "Mark as Out" button (with ArrowUpRight icon) for movements with "Approved" status, both in desktop table and mobile cards.
- **Mark as Returned button**: Added "Mark as Returned" button (with FileCheck icon) for movements with "Out" or "Late Return" status, both in desktop table and mobile cards.
- **approvedBy fix**: Changed `approvedBy: 'admin'` to `approvedBy: user.name` in handleApprove and handleMarkOut.
- **Dialogs**: Added `markOutDialog` and `markReturnedDialog` state and corresponding Dialog components.
- **Handlers**: Added `handleMarkOut` and `handleMarkReturned` async functions.

### 4. Fixed StudentMovements component in `student-portal.tsx`
- **Mark as Departed button**: Added "Mark as Departed" button for movements with "Approved" status in the active movement card. Previously only "Mark Return" was available for Approved/Out/Late Return statuses.
- **Date validation**: Added validation in `handleSubmit` that `expectedReturnDate` must be after `departureDate` before submitting, with a user-friendly error toast.
- **ArrowUpRight import**: Added `ArrowUpRight` to the lucide-react imports.
- **handleMarkDeparted**: Added new handler that sets movement status to "Out" when student marks themselves as departed.

### 5. Fixed Seed Route `/api/seed/route.ts`
- **studentMovement cleanup**: Added `await db.studentMovement.deleteMany()` before `await db.student.deleteMany()` in the cleanup section.
- **Sample movement data**: Added 5 sample StudentMovement records with various statuses (Pending, Approved, Out, Returned, Late Return) with realistic dates, destinations, and guardian contacts.
- **Response update**: Added `movements: 5` to the success response data.

### Build Verification
- `npx next build` completed successfully with no errors.
