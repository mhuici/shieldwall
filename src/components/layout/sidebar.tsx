"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  FileText,
  BookOpen,
  Plus,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import type { Empresa } from "@/lib/types";

interface SidebarProps {
  empresa: Empresa;
  userEmail: string;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Empleados", href: "/empleados", icon: Users },
  { name: "Sanciones", href: "/sanciones", icon: FileText },
  { name: "Bitácora", href: "/bitacora", icon: BookOpen },
];

export function Sidebar({ empresa, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">NL</span>
          </div>
          <span className="font-semibold text-lg">NotiLegal</span>
        </Link>
      </div>

      {/* Empresa */}
      <div className="px-4 py-4 border-b">
        <p className="text-sm font-medium truncate">{empresa.razon_social}</p>
        <p className="text-xs text-muted-foreground">CUIT: {empresa.cuit}</p>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}

        {/* CTA Nueva Sanción */}
        <div className="pt-4">
          <Link href="/sanciones/nueva" onClick={() => setMobileOpen(false)}>
            <Button className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sanción
            </Button>
          </Link>
        </div>
      </nav>

      {/* Usuario */}
      <div className="px-4 py-4 border-t">
        <p className="text-xs text-muted-foreground truncate mb-2">{userEmail}</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-600"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b px-4 h-14 flex items-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="ml-3 font-semibold">NotiLegal</span>
      </div>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white transform transition-transform duration-200 ease-in-out flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col bg-white border-r">
        <SidebarContent />
      </div>

      {/* Mobile spacer */}
      <div className="lg:hidden h-14" />
    </>
  );
}
