import { Sparkles, Video, Cloud } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const features = [
  {
    icon: Sparkles,
    title: "AI Theme Matching",
    description:
      "Our AI analyzes your music and automatically suggests the perfect anime theme that matches your track's mood and tempo.",
  },
  {
    icon: Video,
    title: "Auto Video Generation",
    description:
      "Simply upload your music and watch as our AI generates stunning, synchronized visuals with smooth animations and transitions.",
  },
  {
    icon: Cloud,
    title: "Cloud Library",
    description:
      "Store, manage, and access all your generated videos from anywhere. Share directly to social platforms with one click.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
            Everything you need to create{" "}
            <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
              stunning LoFi videos
            </span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-pretty">
            Powerful AI tools designed to transform your music into captivating visual experiences.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group relative overflow-hidden rounded-2xl border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
            >
              {/* Gradient border top */}
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500" />

              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/10 via-indigo-500/10 to-blue-500/10 ring-1 ring-purple-500/20 transition-all duration-300 group-hover:ring-purple-500/40">
                  <feature.icon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
