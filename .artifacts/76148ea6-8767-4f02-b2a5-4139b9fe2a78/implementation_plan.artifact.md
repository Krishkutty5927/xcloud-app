# Implementation Plan: XCloud Desktop Web Application

Convert the XCloud mobile application feature suite into a modern, responsive Desktop Web Application using Next.js, Tailwind CSS, and Firebase.

## User Review Required

> [!IMPORTANT]
> The web application will be implemented in a new directory `app/web-app`. This setup assumes you have Node.js installed on your machine.
> I will use the Firebase configuration extracted from your `google-services.json`.

> [!NOTE]
> The mobile app currently uses Supabase for storage. As per your request, the web version will use **Firebase Cloud Storage** for file streaming and progress tracking.

## Proposed Changes

### [Web Application Setup]

Initialize the Next.js project and install dependencies.

#### [NEW] [app/web-app](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/web-app)
- Initialize Next.js with App Router, TypeScript, and Tailwind CSS.
- Install `firebase`, `lucide-react` (icons), `react-dropzone` (file uploads), `framer-motion` (animations), and `date-fns`.

### [Core Infrastructure]

Set up Firebase configuration and authentication providers.

#### [NEW] [firebase.ts](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/web-app/src/lib/firebase.ts)
- Initialize Firebase App, Auth, Firestore, and Storage.
- Export Auth providers for Google, Facebook, and Apple.

#### [NEW] [auth-context.tsx](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/web-app/src/context/auth-context.tsx)
- Create a React Context to manage authentication state.
- Handle user metadata persistence to Firestore on login.

### [UI Components & Layout]

Build the responsive desktop layout and reusable components.

#### [NEW] [layout.tsx](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/web-app/src/app/layout.tsx)
- Define the main structure with Sidebar and Header.
- Implement collapsible sidebar navigation (Home, Favourites, Shared, Files, Trash, Settings).

#### [NEW] [header.tsx](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/web-app/src/components/layout/header.tsx)
- Centralized search bar.
- User profile avatar with dropdown menu (Provider identity, Settings, Trash, Logout).

### [Feature Implementation]

Implement the core file management features.

#### [NEW] [dashboard/page.tsx](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/web-app/src/app/dashboard/page.tsx)
- Main dashboard view with file grid/list.
- Drag-and-drop zone using `react-dropzone`.

#### [NEW] [upload-manager.ts](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/web-app/src/lib/upload-manager.ts)
- Logic for quota validation (`storageUsed` vs `storageAvailable`).
- Firebase Storage streaming with upload progress tracking.
- Firestore metadata synchronization.

#### [NEW] [trash/page.tsx](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/web-app/src/app/trash/page.tsx)
- Dedicated Trash view for soft-deleted files.
- Restore and permanent delete actions.

#### [NEW] [storage-widget.tsx](file:///C:/Users/dkris/AndroidStudioProjects/Xcloud/app/web-app/src/components/dashboard/storage-widget.tsx)
- Visual storage consumption breakdown widget.

## Verification Plan

### Automated Tests
- I will verify the build succeeds by running `npm run build` (if possible in the environment).
- I will check for TypeScript errors in the new files.

### Manual Verification
- You can run the application locally using `npm run dev` in the `app/web-app` directory.
- Verify sign-in flows with Google/Facebook/Apple.
- Test drag-and-drop uploads and check progress bars.
- Verify file movements between active directory and Trash.
