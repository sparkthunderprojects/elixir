import ElixirSession from '@/components/elixir/session';
import { ElixirDashboard } from '@/components/elixir/ElixirDashboard';

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-none px-4 py-8 sm:px-8 lg:px-12">
      <ElixirSession>
        <ElixirDashboard />
      </ElixirSession>
    </div>
  );
}
