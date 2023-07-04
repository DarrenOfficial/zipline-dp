import Layout from '@/components/Layout';
import DashboardHome from '@/components/pages/dashboard';
import useLogin from '@/lib/hooks/useLogin';
import { LoadingOverlay } from '@mantine/core';

export default function DashboardIndex() {
  const { loading } = useLogin();
  if (loading) return <LoadingOverlay visible />;

  return (
    <Layout>
      <DashboardHome />
    </Layout>
  );
}
