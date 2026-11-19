import ElixirSession from '@/components/elixir/session';
import ContentManager from '@/components/cms/ContentManager';

export default function ContentPage() {
  return (
    <div className="mx-auto max-w-none px-4 py-6 sm:px-8 lg:px-12">
      <ElixirSession>
        <ContentManager />
      </ElixirSession>
    </div>
  );
}
