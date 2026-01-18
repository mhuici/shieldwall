import { Metadata } from "next";
import { ConvenioClient } from "./client";

export const metadata: Metadata = {
  title: "Convenio de Domicilio Electrónico - NotiLegal",
  description: "Firme su convenio de domicilio electrónico para recibir notificaciones laborales",
};

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ConvenioPage({ params }: PageProps) {
  const { token } = await params;

  return <ConvenioClient token={token} />;
}
