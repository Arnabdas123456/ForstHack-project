"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for trying the core AI workflow.",
    features: [
      "5 videos per month",
      "AI song generation access",
      "Standard render queue",
      "Basic cloud storage",
      "Community support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "Built for creators and teams shipping regularly.",
    features: [
      "Unlimited media generation",
      "Priority render queue",
      "Advanced visual themes",
      "Unlimited cloud storage",
      "Priority support",
      "Studio-grade export controls",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-sky-200/80">Pricing</p>
          <h2 className="mt-2 text-balance text-3xl font-semibold text-slate-100 sm:text-4xl">
            Simple plans for
            <span className="brand-gradient-text"> serious creator velocity</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-300/85 sm:text-lg">
            Start free and scale as your content pipeline grows. No lock-in, transparent pricing.
          </p>
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 lg:grid-cols-2">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Card
                className={`spotlight h-full overflow-hidden rounded-3xl py-0 ${
                  plan.popular ? "border-sky-300/35" : "border-sky-200/20"
                }`}
              >
                <div className="h-1.5 brand-gradient-bg" />
                <CardHeader className="border-b border-white/10 pb-4 pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-xl text-slate-100">{plan.name}</CardTitle>
                      <CardDescription className="mt-1 text-slate-400">{plan.description}</CardDescription>
                    </div>
                    {plan.popular ? (
                      <div className="inline-flex items-center gap-1 rounded-full border border-sky-200/30 bg-sky-300/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-sky-100">
                        <Crown className="h-3.5 w-3.5" />
                        Popular
                      </div>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6 p-6">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-semibold text-slate-100">{plan.price}</span>
                    {plan.period ? <span className="pb-1 text-slate-400">{plan.period}</span> : null}
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-300/90">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-sky-200/20 bg-slate-900/60">
                          <Check className="h-3.5 w-3.5 text-sky-200" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="border-t border-white/10 p-6">
                  <Link href="/register" className="w-full">
                    <Button className="h-11 w-full rounded-xl" variant={plan.popular ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
