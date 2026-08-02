import { redirect } from 'next/navigation';

/** Activity telemetry lives on Attendance — keep URL for bookmarks. */
export default function ActivityPage() {
  redirect('/attendance');
}
