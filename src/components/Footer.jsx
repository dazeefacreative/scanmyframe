import { Link } from "react-router-dom"
import { Icon } from "@iconify/react"
import { motion } from "framer-motion"

import logo from "../assets/images/Scanframe.png"
import NewsletterForm from "./NewsletterForm"

const FooterLinks = [
  { href: "/", label: "Home" },
  { href: "/#who_its_for", label: "Who It's For" },
  { href: "/#create_frames", label: "Generate Code" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About Us" },
]

// Route-based support links
const supportLinks = [
  { href: "/contact", label: "Contact Us" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms",   label: "Terms of Use" },
]

const anchorLinks = [
  { href: "/#faq",        label: "FAQ" },
  { href: "/#guidelines", label: "How It Works" },
]

function openCookiePrefs(e) {
  e.preventDefault();
  window.dispatchEvent(new CustomEvent('sf:openCookiePrefs'));
}

export default function Footer() {
  return (
    <footer className="flex flex-col bg-primary text-secondary py-20 px-6 gap-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 justify-between mx-auto px-4 max-w-7xl">

        {/* Brand */}
        <motion.div className="max-w-md flex flex-col gap-4 items-start" initial={{ opacity: 0, y: -200 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <img src={logo} alt="ScanMyFrame Logo" className="w-16 h-auto" />
          <span className="font-bold">Stay Connected</span>
          <p>Follow us on social media and be part of the community bringing frames to life.</p>
          <div className="flex gap-2 mt-2">
            <a href="https://www.instagram.com/scanmyframe" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:text-brand-green-hover transition-colors duration-200">
              <Icon icon="iconoir:instagram" className="size-6" />
            </a>
            <a href="https://www.tiktok.com/@scanmyframe" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:text-brand-green-hover transition-colors duration-200">
              <Icon icon="iconoir:tiktok" className="size-6" />
            </a>
            <a href="https://www.x.com/scanmyframe" target="_blank" rel="noopener noreferrer" className="text-brand-green hover:text-brand-green-hover transition-colors duration-200">
              <Icon icon="iconoir:x" className="size-6" />
            </a>
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div className="flex flex-col gap-2" initial={{ opacity: 0, y: -200 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="font-semibold mb-4">Navigation</span>
          {FooterLinks.map((link) => (
            <Link key={link.label} to={link.href} className="text-sm hover:text-brand-green transition-colors duration-200">
              {link.label}
            </Link>
          ))}
        </motion.div>

        {/* Support + Legal */}
        <motion.div className="flex flex-col gap-2" initial={{ opacity: 0, y: -200 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="font-semibold mb-4">Support</span>
          {anchorLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm hover:text-brand-green transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
          {supportLinks.map((link) => (
            <Link key={link.label} to={link.href} className="text-sm hover:text-brand-green transition-colors duration-200">
              {link.label}
            </Link>
          ))}
          <button
            onClick={openCookiePrefs}
            className="text-sm text-left hover:text-brand-green transition-colors duration-200 bg-transparent border-none cursor-pointer text-secondary p-0 font-inherit mt-0"
          >
            Cookie Preferences
          </button>
        </motion.div>

        {/* Newsletter */}
        <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: -200 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="font-semibold">Subscribe to our Newsletter</span>
          <NewsletterForm />
          <p className="text-sm font-light">© {new Date().getFullYear()} ScanMyFrame. All rights reserved.</p>
        </motion.div>

      </div>
    </footer>
  )
}