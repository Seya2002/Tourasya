import Home from '@/components/Home/Home';
import RequireAuth from '@/components/Helper/RequireAuth';

export default function HomePage() {
  return (
    <RequireAuth>
      <Home />
    </RequireAuth>
  );
}
