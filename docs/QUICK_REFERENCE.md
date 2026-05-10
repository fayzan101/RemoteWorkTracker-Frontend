# Organization ID Auto-Injection - Quick Reference

## 🚀 TL;DR

Organization context is now automatically available on all pages and auto-injected into forms.

## 📍 Where to Use

### In Any Component
```typescript
import { useAuth } from '@/hooks';

const MyComponent = () => {
  const { organizationId, user } = useAuth();
  
  if (!organizationId) return <div>Loading...</div>;
  
  return <div>Org: {organizationId}</div>;
};
```

### In CRUD Pages
```typescript
const { organizationId } = useAuth();
const [formData, setFormData] = useState({
  name: '',
  organization_id: organizationId || '', // AUTO-FILLED!
});

const handleSubmit = async (e) => {
  const dataToSubmit = {
    ...formData,
    organization_id: organizationId || formData.organization_id,
  };
  await createItem.mutateAsync(dataToSubmit);
};
```

## 🔗 New Routes

- **Admin Panel**: `/admin` - Organization management
- **Analytics**: `/analytics` - Metrics & reporting  
- **Activity Log**: `/activity` - Audit trail

All accessible from sidebar navigation.

## 📚 Documentation

1. [Setup Guide](ORGANIZATION_SETUP.md) - How it works
2. [Implementation Summary](SESSION_IMPLEMENTATION_SUMMARY.md) - What was done
3. [Verification Checklist](VERIFICATION_CHECKLIST.md) - How to test

## ✅ What's Done

- ✅ useAuth() hook created
- ✅ AuthContext includes organizationId
- ✅ All CRUD pages have useAuth imported
- ✅ Projects page has full org_id injection
- ✅ Admin, Analytics, Activity pages created
- ✅ Navigation updated with new pages

## ⏳ What's Pending

- ⏳ Form handleSubmit updates (Goals, Learning, Wellness, Roles, Departments)
- ⏳ Backend API validation with org_id
- ⏳ Analytics API implementation
- ⏳ Activity API implementation
- ⏳ Admin panel logic

## 🆘 Quick Help

**Q: How do I access organization ID?**  
A: `const { organizationId } = useAuth();`

**Q: Do I need to manually pass org_id to API?**  
A: On Projects - it's auto-injected. On other pages - inject in handleSubmit.

**Q: Where do I add org_id to forms?**  
A: Initial state + handleSubmit callback (see Projects page for pattern)

**Q: How do I add a new organization-scoped page?**  
A: 
1. Create component in `src/app/(main)/my-feature/page.tsx`
2. Import and use `useAuth()` hook
3. Add to `mainNavItems` in MainShell.tsx

---

**Version**: 1.0 | **Last Updated**: April 20, 2026
