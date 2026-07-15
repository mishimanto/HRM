import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#edf6f7]">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="relative flex-1 overflow-auto bg-[linear-gradient(135deg,#e7f5f5_0%,#f6f8fb_42%,#eef2ff_72%,#fff7ed_100%)]">
          <div className="pointer-events-none fixed inset-y-0 right-0 w-1/2 bg-[linear-gradient(180deg,rgba(20,184,166,0.10),rgba(245,158,11,0.08),rgba(244,63,94,0.07))]" />
          <div className="pointer-events-none fixed left-72 top-20 h-40 w-[calc(100vw-18rem)] border border-white/55 bg-white/25 shadow-[0_24px_80px_rgba(15,33,55,0.06)]" />
          <div className="relative mx-auto w-full p-4 sm:p-6"><Outlet /></div>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
