'use client';

import "./globals.css";
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { motion } from 'framer-motion';
import Navbar from '@/components/NavBar';
import Footer from "@/components/Footer";

const Layout = ({ children }) => {
  const router = useRouter();


  const pageVariants = {
    initial: { opacity: 0, x: -100 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeInOut" } },
    exit: { opacity: 0, x: 100, transition: { duration: 0.3, ease: "easeInOut" } },
  };

  return (
    <html lang="en">
      <Head>
        <title>LoA</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="LoA is more than just a journal app—it’s your personal biographer. With the help of Eve, your AI biographer, you’ll embark on a journey of self-reflection, rediscovery, and storytelling" />
        <link rel="shortcut icon" href="/loa.svg" />
        <meta property="og:title" content="LoA | Your Personal Biographer" />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://loa.vercel.app" />
        <meta property="og:image" content="hhttps://loa.vercel.app/loa.svg" />
        <meta property="og:description" content="LoA is more than just a journal app—it’s your personal biographer." />
        <meta name="twitter:card" content="summary"/>
        <meta name="twitter:site" content=""/>
        <meta name="twitter:title" content=""/>
        <meta name="twitter:description" content=""/>
        <meta name="twitter:creator" content=""/>
        <meta name="twitter:image" content="https://loa.vercel.app"/>
        <!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '489803712358979');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=489803712358979&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->
      </Head>

      <body className="bg-secondary text-primary min-h-screen flex flex-col">
        <header className="w-full">
          <Navbar />
        </header>

        <motion.main
          className="w-full mx-auto py-8"
          key={router.route}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.main>

        <Footer />
      </body>
    </html>
  );
};

export default Layout;