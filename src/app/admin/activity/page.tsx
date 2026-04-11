import { requireAdmin } from "@/lib/adminAuth";
import { ActivityFeed } from "./ActivityFeed";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  await requireAdmin();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-text-primary">Live Activity</h1>
        <p className="text-text-secondary text-sm">Real-time audit trail across the platform</p>
      </div>
      <ActivityFeed />
    </div>
  );
}
