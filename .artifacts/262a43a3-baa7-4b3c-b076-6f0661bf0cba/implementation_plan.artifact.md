# Advanced Cloud Storage & Collaboration Features

Implement offline sync, secure sharing, soft delete, and storage analytics for XCloud.

## User Review Required

- **Offline Sync Strategy**: Files marked for offline will be cached in the device's local storage and tracked via a Room Database. I will implement a basic background sync placeholder.
- **Secure Sharing**: Secure links will be implemented by generating a unique `shareId` and storing it in Firestore with optional `passcode` and `expiryTimestamp`. The app will handle these links to allow downloads.
- **Conflict Resolution**: For multi-device sync, we will use Firestore's `addSnapshotListener` (via GitLive Firebase snapshots) to ensure the UI updates instantly.

## Proposed Changes

### 1. Data Models & Local Storage

#### [MODIFY] [FileEntry.kt](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/core/src/commonMain/kotlin/com/cloud/x/model/FileEntry.kt)
- Add fields: `isOffline`, `isStarred`, `isShared`, `shareId`, `passcode`, `expiryTimestamp`.

#### [NEW] [LocalFileEntity.kt](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/core/src/commonMain/kotlin/com/cloud/x/model/LocalFileEntity.kt)
- Room entity for caching file metadata and local file paths.

#### [NEW] [XCloudDatabase.kt](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/androidApp/src/main/kotlin/com/cloud/x/db/XCloudDatabase.kt)
- Room database setup for Android.

### 2. Repositories & Logic

#### [MODIFY] [FileRepository.kt](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/core/src/commonMain/kotlin/com/cloud/x/repository/FileRepository.kt)
- Update `moveToTrash` to handle soft-delete properly.
- Implement `generateSecureLink` and `verifyShareLink`.
- Add `getStorageBreakdown` logic.
- Ensure `getFiles` and `getTrashFiles` use snapshots for real-time updates.

#### [NEW] [OfflineManager.kt](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/core/src/commonMain/kotlin/com/cloud/x/util/OfflineManager.kt)
- Logic for downloading files and updating local cache.

### 3. UI Components

#### [MODIFY] [DashboardScreen.kt](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/shared/src/commonMain/kotlin/com/cloud/x/app/shared/ui/DashboardScreen.kt)
- Integrate `StorageBreakdownWidget`.
- Add "Offline" toggle in file options.
- Update Trash navigation to open a dedicated `TrashScreen`.

#### [NEW] [StorageBreakdownWidget.kt](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/shared/src/commonMain/kotlin/com/cloud/x/app/shared/ui/components/StorageBreakdownWidget.kt)
- Multi-color progress bar showing distribution (Images, Videos, etc.).

#### [NEW] [ShareSheet.kt](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/shared/src/commonMain/kotlin/com/cloud/x/app/shared/ui/components/ShareSheet.kt)
- Intent-style share sheet for public links.

## Verification Plan

### Automated Tests
- Unit tests for storage breakdown calculation.
- Unit tests for expiry timestamp validation.

### Manual Verification
- Mark a file as "Offline", disable internet, and verify it can be opened.
- Delete a file, find it in Trash, and Restore it.
- Observe real-time updates by modifying Firestore from the console.
- Generate a share link and verify the intent chooser appears.
