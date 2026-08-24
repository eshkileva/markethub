import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldOff } from 'lucide-react';
import { apiRequest } from '@/shared/api/client';
import { useAuthStore } from '@/shared/model/stores';
import { Button } from '@/shared/ui/button';

type ProfileUser = {
  id: string;
  username: string;
  isVerified: boolean;
};

export function VerifySellerButton({ user }: { user: ProfileUser }) {
  const token = useAuthStore((s) => s.accessToken);
  const role = useAuthStore((s) => s.user?.role);
  const currentId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const canModerate = role === 'moderator' || role === 'admin';

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest<ProfileUser>(`/v1/users/${user.id}/${user.isVerified ? 'unverify' : 'verify'}`, {
        method: 'POST',
        token,
        body: {},
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', user.username] });
    },
  });

  if (!token || !canModerate || currentId === user.id) return null;

  return (
    <Button
      type="button"
      size="sm"
      variant={user.isVerified ? 'secondary' : 'outline'}
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {user.isVerified ? (
        <>
          <ShieldOff className="h-3.5 w-3.5" />
          Снять подтверждение
        </>
      ) : (
        <>
          <ShieldCheck className="h-3.5 w-3.5" />
          Подтвердить продавца
        </>
      )}
    </Button>
  );
}
