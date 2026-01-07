import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { styles } from '../styles';
import { navLinks } from '../constants'; // Assuming you have your links here

const Navbar = () => {
  const [active, setActive] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      if (scrollTop > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    // CONTAINER: Centers the pill horizontally and fixes it to the top
    <nav className={`fixed top-6 inset-x-0 z-50 flex justify-center transition-all duration-300 ${scrolled ? 'top-4' : 'top-6'}`}>
      
      {/* THE GLASS PILL */}
      <div className={`
        flex items-center justify-between
        bg-white/40 backdrop-blur-md 
        border border-white/60 
        rounded-full 
        px-8 py-3 
        shadow-sm hover:shadow-md transition-all duration-300
        min-w-[300px] md:min-w-[500px] gap-8
      `}>
        
        {/* LOGO: Clean and minimal */}
        <Link 
          to="/" 
          className="flex items-center gap-2"
          onClick={() => {
            setActive("");
            window.scrollTo(0, 0);
          }}
        >
          {/* Using the Raspberry brand color */}
          <p className="text-[#831843] text-[16px] font-bold cursor-pointer font-serif italic tracking-wider">
            Marjut
          </p>
        </Link>

        {/* DESKTOP LINKS */}
        <ul className="list-none hidden sm:flex flex-row gap-8">
          {navLinks.map((link) => (
            <li
              key={link.id}
              className={`
                ${active === link.title ? "text-[#831843] font-bold" : "text-[#831843]/70"}
                hover:text-[#831843] text-[14px] font-medium cursor-pointer transition-colors
              `}
              onClick={() => setActive(link.title)}
            >
              <a href={`#${link.id}`}>{link.title}</a>
            </li>
          ))}
        </ul>

        {/* MOBILE MENU BUTTON (If needed) */}
        {/* Simplified for the visual update - typical hamburger would go here */}
        <div className="sm:hidden flex flex-1 justify-end items-center">
            <span className="text-[#831843] text-xl">≡</span>
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
