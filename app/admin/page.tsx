import ElixirSession from '@/components/elixir/session';
import { ElixirDashboard } from '@/components/elixir/ElixirDashboard';

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ElixirSession>
        <ElixirDashboard />
      </ElixirSession>
    </div>
  );
}
