import { createFileRoute } from '@tanstack/react-router';
import { ProfilePage } from '@/pages/profile/ui/ProfilePage';

export const Route = createFileRoute('/profile/$username')({
  component: ProfileRoute,
});

function ProfileRoute() {
  const { username } = Route.useParams();
  return <ProfilePage username={username} />;
}
