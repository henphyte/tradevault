import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ProfileProvider } from "@/hooks/useProfile";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProfileProvider>
      <TooltipProvider delayDuration={200}>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 p-4 md:p-6 max-w-[1600px] w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </ProfileProvider>
  );
}
