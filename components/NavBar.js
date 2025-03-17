'use client'

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Button from './Button';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const isActive = (pathname) => {
    return router.pathname === pathname ? 'text-silver' : 'text-white hover:text-gray-300 transition-colors duration-300';
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const navbarVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 w-full min-h-[80px] z-50 bg-primary"
      variants={navbarVariants}
      initial="hidden"
      animate="visible"
    >
      <article className="p-4 px-5 md:px-[5%] w-full mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center cursor-pointer font-ubuntu text-white md:text-xl font-bold" onClick={() => setIsOpen(false)}>
          <Image src="/ever.svg" alt="Ever Journal" width={30} height={30} />
          Ever Journal
        </Link>

        <ul className="hidden md:flex space-x-12">
          <li><Link href="/about-us" className={isActive('/about-us')} onClick={toggleMenu}>About Us</Link></li>
          <li><Link href="/features" className={isActive('/features')}>Features</Link></li>
          <li><Link href="/premium" className={isActive('/premium')}>Premium</Link></li>
          <li><Link href="/updates" className={isActive('/updates')}>What&apos;s New</Link></li>
        </ul>

        <div className='hidden md:flex'>
          <Button text="Join the Waitlist" />
        </div>

        {/* Mobile Menu Button */}
        <article className="md:hidden flex items-center justify-between w-[50%]">
          <Button text="Join the Waitlist" />
          <motion.button
            onClick={toggleMenu}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            {isOpen ? (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            )}
          </motion.button>
        </article>
      </article>

      {/* Mobile Menu */}
      <motion.article
        className={`md:hidden ${isOpen ? 'fixed block inset-0 min-h-[100vh] top-[80px] transform translate-y-0 transition-transform duration-300 w-full bg-bg' : 'fixed hidden inset-0 transform -translate-y-full transition-transform duration-300'}`}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: isOpen ? 1 : 0, y: isOpen ? 0 : -10 }}
        transition={{ duration: 0.3 }}
      >    
        <ul className="flex text-secondary flex-col items-center pt-28 space-y-14">
          <li className="text-3xl"><Link href="/about-us" className={isActive('/about-us')} onClick={toggleMenu}>About Us</Link></li>
          <li className="text-3xl"><Link href="/features" className={isActive('/features')} onClick={toggleMenu}>Features</Link></li>
          <li className="text-3xl"><Link href="/premium" className={isActive('/premium')} onClick={toggleMenu}>Premium</Link></li>
          <li className="text-3xl"><Link href="/updates" className={isActive('/updates')} onClick={toggleMenu}>What&apos;s New</Link></li>
        </ul>
      </motion.article>
    </motion.nav>
  );
};

export default Navbar;
