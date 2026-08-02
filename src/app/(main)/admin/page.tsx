import { redirect } from 'next/navigation';

/** Admin hub is covered by /dashboard — keep URL for bookmarks. */
export default function AdminOrganizationPage() {
  redirect('/dashboard');
}
