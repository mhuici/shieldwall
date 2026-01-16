import { DescargoClient } from "./client";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function DescargoPage({ params }: PageProps) {
  const { token } = await params;
  return <DescargoClient token={token} />;
}

export const metadata = {
  title: "Audiencia de Descargo - NotiLegal",
  description: "Presente su descargo ante la sanción recibida",
};
