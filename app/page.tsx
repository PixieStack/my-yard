import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { HomeSearchForm } from "@/components/home-search-form"
import { Home, Users, Shield, Star, MapPin, CheckCircle, Search, Zap, TrendingUp, Award, Globe, ArrowRight, Sparkles, Building2, Heart, Sun } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Animated Background Shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-br from-orange-300/30 to-amber-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-yellow-300/30 to-orange-300/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-80 h-80 bg-gradient-to-br from-amber-300/20 to-yellow-300/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Modern Header */}
        <header className="border-b border-orange-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
                <div className="relative">
                  <Image 
                    src="https://ffkvytgvdqipscackxyg.supabase.co/storage/v1/object/public/public-assets/my-yard-logo.png" 
                    alt="MyYard" 
                    width={50} 
                    height={50}
                    className="group-hover:scale-110 transition-transform duration-300 drop-shadow-lg"
                  />
                </div>
                <div>
                  <span className="text-2xl font-black bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                    MyYard
                  </span>
                  <p className="text-[10px] text-orange-600/80 -mt-1 font-bold tracking-wider uppercase">Where Community Finds Home</p>
                </div>
              </Link>
              <div className="flex items-center gap-3">
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-slate-700 hover:text-orange-600 hover:bg-orange-50 font-semibold">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white font-bold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 group">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-24 px-4 relative">
          <div className="container mx-auto">
            <div className="max-w-6xl mx-auto text-center">
              <Badge className="mb-8 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-300 px-6 py-3 font-bold shadow-md">
                <Sun className="w-4 h-4 mr-2 inline animate-spin" style={{animationDuration: '3s'}} />
                South Africa's #1 Township Rental Platform
              </Badge>
              
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
                <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent block mb-2">
                  Find Your Perfect
                </span>
                <span className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                  Township Home
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                Connect landlords and tenants across Soweto, Sandton, Khayelitsha and 870+ locations. 
                <span className="text-orange-600 font-bold"> Fast. Safe. Simple.</span>
              </p>

              {/* Search Bar */}
              <div className="max-w-3xl mx-auto mb-12">
                <HomeSearchForm />
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/auth/register?role=tenant">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-12 py-7 rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:scale-105 transition-all duration-300"
                  >
                    <Users className="mr-3 h-6 w-6" />
                    I'm Looking for a Home
                  </Button>
                </Link>
                <Link href="/auth/register?role=landlord">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white border-3 border-orange-500 text-orange-600 hover:bg-orange-50 px-12 py-7 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                  >
                    <Building2 className="mr-3 h-6 w-6" />
                    I'm a Property Owner
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4 bg-white/80 backdrop-blur-xl border-y-2 border-orange-200/50">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: "2,500+", label: "Properties Listed", icon: Home, color: "orange" },
                { number: "15K+", label: "Happy Tenants", icon: Users, color: "amber" },
                { number: "98%", label: "Success Rate", icon: Award, color: "yellow" },
                { number: "24/7", label: "Support", icon: Zap, color: "orange" },
              ].map((stat, i) => (
                <div key={i} className="text-center group cursor-pointer">
                  <div className={`inline-block p-4 bg-gradient-to-br from-${stat.color}-100 to-${stat.color}-200 rounded-2xl mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <stat.icon className={`h-10 w-10 text-${stat.color}-600`} />
                  </div>
                  <div className={`text-5xl font-black bg-gradient-to-r from-${stat.color}-600 to-amber-600 bg-clip-text text-transparent mb-2`}>
                    {stat.number}
                  </div>
                  <p className="text-slate-600 font-semibold">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6">
                Why Choose MyYard?
              </h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto font-medium">
                Everything you need to find or rent properties in South African townships
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Shield,
                  title: "100% Verified",
                  description: "Every property and user is verified for your safety and peace of mind",
                  features: ["Email verification", "Secure profiles", "Safe payments"],
                  gradient: "from-orange-500 to-amber-500"
                },
                {
                  icon: MapPin,
                  title: "870+ Locations",
                  description: "Find homes across all major townships, suburbs, and CBDs in South Africa",
                  features: ["Smart search", "Township-specific", "GPS integrated"],
                  gradient: "from-amber-500 to-yellow-500"
                },
                {
                  icon: Zap,
                  title: "Instant Matching",
                  description: "Apply to multiple properties with one click and get instant responses",
                  features: ["One-click apply", "Real-time updates", "Direct messaging"],
                  gradient: "from-yellow-500 to-orange-500"
                },
              ].map((feature, i) => (
                <Card key={i} className="group relative bg-white border-2 border-orange-200 hover:border-orange-400 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-2">
                  <CardContent className="p-8">
                    <div className={`inline-block p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                      <feature.icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 mb-6 leading-relaxed font-medium">{feature.description}</p>
                    <ul className="space-y-3">
                      {feature.features.map((item, j) => (
                        <li key={j} className="flex items-center text-slate-700 font-medium">
                          <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0 text-orange-500" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 relative bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500">
          <div className="container mx-auto relative">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6 drop-shadow-lg">
                Ready to Find Your Home?
              </h2>
              <p className="text-xl text-white/90 mb-12 font-medium">
                Join thousands of happy tenants and landlords on MyYard today
              </p>
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-orange-50 px-16 py-8 rounded-2xl font-black text-2xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300"
                >
                  Start Now - It's Free
                  <ArrowRight className="ml-3 h-8 w-8" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 bg-slate-900 text-white">
          <div className="container mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Image src="/myyard-logo.svg" alt="MyYard" width={40} height={40} />
                <span className="text-2xl font-black bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  MyYard
                </span>
              </div>
              <p className="text-slate-400 mb-6 font-medium">
                Where Community Finds Home • Built for South Africa
              </p>
              <p className="text-slate-500 text-sm">
                © 2025 MyYard. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
