import { useState } from 'react';
import Navbar from './Navbar';
import HamburgerMenu from './HamburgerMenu';

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Navbar onMenuToggle={() => setMenuOpen(true)} />
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="min-h-screen pt-16 pb-8">
        {children}
      </main>
    </>
  );
}
