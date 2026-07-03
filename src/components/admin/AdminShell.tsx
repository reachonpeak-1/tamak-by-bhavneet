"use client";

import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`adm-shell ${isOpen ? "is-sidebar-open" : ""}`}>
      <AdminSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      {isOpen && (
        <div className="adm-sidebar-overlay" onClick={() => setIsOpen(false)} />
      )}
      <div className="adm-main">
        <AdminTopbar email={email} onMenuOpen={() => setIsOpen(true)} />
        <main className="adm-content">{children}</main>
      </div>
    </div>
  );
}
