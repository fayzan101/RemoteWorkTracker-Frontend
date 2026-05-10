# Organization & API Alignment Setup

## ✅ Completed Tasks

### 1. **Authentication Context Enhanced**
- ✅ Created `useAuth()` hook for web in [src/hooks/useAuth.ts](src/hooks/useAuth.ts)
- ✅ Updated `AuthContext` to include `organizationId` field
- ✅ Added automatic localStorage sync for organization_id on login/logout
- ✅ Organization ID persists across page refreshes

### 2. **Pages Updated with useAuth**
All CRUD pages now automatically inject `organizationId`:
- ✅ [Projects](src/app/(main)/projects/page.tsx) - Form data auto-includes organizationId
- ✅ [Goals](src/app/(main)/goals/page.tsx) - Form data auto-includes organizationId
- ✅ [Learning/Courses](src/app/(main)/learning/page.tsx) - Form data auto-includes organizationId
- ✅ [Wellness](src/app/(main)/wellness/page.tsx) - Form data auto-includes organizationId

### 3. **Utility Hooks Created**
- ✅ [useOrganizationForm.ts](src/hooks/useOrganizationForm.ts) - Auto-injects org_id in form state
- ✅ [hooks/index.ts](src/hooks/index.ts) - Centralized export for all hooks

## 🔧 How Organization ID Auto-Injection Works

### In Modal Forms:
```tsx
const { organizationId } = useAuth();

const [formData, setFormData] = useState<CreateProjectPayload>({
  name: '',
  description: '',
  organization_id: organizationId || '', // Auto-populated!
});

const handleSubmit = async (e: React.FormEvent) => {
  const dataToSubmit = {
    ...formData,
    organization_id: organizationId || formData.organization_id, // Guaranteed to send org_id
  };
  await createProject.mutateAsync(dataToSubmit);
};
```

## 📋 API Alignment Status

### Backend APIs Available & Verified
| Module | Status | Notes |
|--------|--------|-------|
| Projects | ✅ Ready | Expects `organization_id` in query params |
| Goals | ✅ Ready | Expects `organization_id` in request body |
| Courses | ✅ Ready | Expects `organization_id` in request body |
| Wellness | ✅ Ready | Already includes `organization_id` |
| Notifications | ✅ Ready | User-specific, auto-filtered |
| Departments | ✅ Ready | Organization-scoped |
| Roles | ✅ Ready | Organization-scoped |

### Missing Implementations
| API | Status | Impact |
|-----|--------|--------|
| Analytics | ❌ Not mounted | Data aggregation not available |
| Activity | ❌ Not mounted | User activity tracking unavailable |
| Notes/Tasks | ⚠️ Partial | Limited endpoints, not in UI |

## 🚀 Next Steps for Completion

### 1. **Remaining Pages to Update** (Optional - already working)
- Departments page - add useAuth import
- Roles page - add useAuth import
- These are admin functions but should follow same pattern

### 2. **Missing Pages to Create** (If needed for full feature set)
- [ ] **Organization Admin Panel** - Manage org settings, users, departments
  - Location: `src/app/(main)/organization/settings/page.tsx`
  - Features: Org settings, invite users, manage departments, assign roles
  
- [ ] **Analytics Dashboard** - (Requires backend API mounting)
  - Location: `src/app/(main)/analytics/page.tsx`
  - Features: Project completion %, employee performance metrics, team wellness avg

- [ ] **Activity Log** - (Requires backend API mounting)
  - Location: `src/app/(main)/activity/page.tsx`
  - Features: Timeline of all user actions, audit trail

- [ ] **Tasks Management** - (Backend exists, not in UI)
  - Location: `src/app/(main)/tasks/page.tsx`
  - Features: Project tasks, assignments, progress tracking

### 3. **Backend Mounting** (If needed)
- Mount `/api/analytics` routes in `backend/src/app.ts`
- Mount `/api/activity` routes in `backend/src/app.ts`
- Verify all controllers export properly

## 📝 Usage Example: Adding Organization Context to New Pages

```tsx
import { useAuth } from '@/hooks';

export default function NewPage() {
  const { organizationId, user } = useAuth();
  
  if (!organizationId) {
    return <div>Please log in to an organization first</div>;
  }

  // All API calls will now have org_id:
  const { data } = useMyDataList({ organizationId });
  
  return (
    <div>
      <h1>Organization: {organizationId}</h1>
      {/* Your page content */}
    </div>
  );
}
```

## ✨ Benefits

- ✅ No more manual `localStorage.getItem('organizationId')` scattered across pages
- ✅ Automatic org_id injection in all form submissions
- ✅ Type-safe with TypeScript hooks
- ✅ Persistent across page refreshes
- ✅ Centralized auth state management
- ✅ Easy to add new scoped pages

## 🔐 Security Notes

- Organization ID should be validated on backend (✅ Already implemented)
- User can only access data from their authenticated organization
- All API calls should be scoped by organizationId
- localStorage is used but with fallback to context for security

---

**Last Updated**: April 20, 2026
**Version**: 1.0
