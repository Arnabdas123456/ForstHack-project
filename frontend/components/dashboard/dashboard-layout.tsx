"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { DashboardSidebar } from "./dashboard-sidebar"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="relative min-h-screen">
      <DashboardSidebar />

      <div className="relative lg:pl-[18.5rem]">
        <main className="px-3 pb-10 pt-20 sm:px-5 lg:px-7 lg:pt-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(6px)" }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-[1540px]"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
