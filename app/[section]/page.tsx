import { notFound } from "next/navigation";
import Workspace from "@/components/workspace";
const routes = ["chat", "cost", "procurement", "excel", "cleaning", "settings"];
export function generateStaticParams() {
  return routes.map((section) => ({ section }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!routes.includes(section)) notFound();
  return <Workspace section={section} />;
}
