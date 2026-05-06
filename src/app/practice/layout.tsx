import AppLayout from "@/components/layout/AppLayout";

export default function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
