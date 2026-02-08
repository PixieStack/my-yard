import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Users, Shield, Star, MapPin, CheckCircle, Search, Zap, TrendingUp, Award, Lock, Globe, ArrowRight, Sparkles, Building2, Heart } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        {/* Futuristic Header */}
        <header className="border-b border-white/10 bg-black/40 backdrop-blur-2xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 group cursor-pointer">
                <div className="relative">
                  <Image 
                    src="/myyard-logo.svg" 
                    alt="MyYard" 
                    width={45} 
                    height={45}
                    className="group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
                </div>
                <div>
                  <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                    MyYard
                  </span>
                  <p className="text-[10px] text-emerald-400/80 -mt-1 font-medium tracking-wider uppercase">Future of Township Living</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 font-medium border border-white/10">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold shadow-lg shadow-emerald-500/50 hover:shadow-emerald-500/70 transition-all duration-300 group">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-32 px-4 relative">
          <div className="container mx-auto">
            <div className="max-w-5xl mx-auto text-center">
              <Badge className="mb-8 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-6 py-3 font-semibold backdrop-blur-xl">
                <Sparkles className="w-4 h-4 mr-2 inline" />
                Powered by AI • Secured by Blockchain
              </Badge>
              
              <h1 className="text-7xl md:text-8xl font-black mb-8 leading-none">
                <span className="bg-gradient-to-r from-white via-emerald-200 to-teal-200 bg-clip-text text-transparent block mb-4">
                  Township Living
                </span>
                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
                  Reimagined
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-3xl mx-auto leading-relaxed">
                The future of property rental in South Africa. AI-powered search, instant verification, and blockchain-secured transactions.
              </p>

              {/* Futuristic Search Bar */}
              <div className="max-w-2xl mx-auto mb-12">
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-1000"></div>
                  <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
                        <input
                          type="text"
                          placeholder="Soweto, Sandton, Khayelitsha..."
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-white placeholder:text-white/40 backdrop-blur-xl"
                        />
                      </div>
                      <Button className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 px-8 py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/50 group">
                        <Search className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                        Search Properties
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/auth/register?role=tenant" className="group">
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                    <Button
                      size="lg"
                      className="relative w-full sm:w-auto bg-black border-2 border-emerald-500/50 text-white hover:bg-emerald-500/10 px-10 py-7 rounded-2xl font-bold text-lg backdrop-blur-xl"
                    >
                      <Users className="mr-3 h-6 w-6" />
                      Find Your Home
                    </Button>
                  </div>
                </Link>
                <Link href="/auth/register?role=landlord" className="group">
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl blur opacity-30 group-hover:opacity-70 transition duration-300"></div>
                    <Button
                      size="lg"
                      className="relative w-full sm:w-auto bg-black border-2 border-teal-500/50 text-white hover:bg-teal-500/10 px-10 py-7 rounded-2xl font-bold text-lg backdrop-blur-xl"
                    >
                      <Building2 className="mr-3 h-6 w-6" />
                      List Property
                    </Button>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-4 border-y border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: "2,500+", label: "Properties", icon: Home },
                { number: "15K+", label: "Happy Tenants", icon: Users },
                { number: "98%", label: "Success Rate", icon: Award },
                { number: "24/7", label: "AI Support", icon: Zap },
              ].map((stat, i) => (
                <div key={i} className="text-center group cursor-pointer">
                  <div className="relative inline-block mb-4">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
                    <stat.icon className="relative h-12 w-12 mx-auto text-emerald-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <p className="text-white/60 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                Next-Gen Features
              </h2>
              <p className="text-xl text-white/60 max-w-2xl mx-auto">
                Experience the future of property management with cutting-edge technology
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Shield,
                  title: "Military-Grade Security",
                  description: "End-to-end encryption and blockchain-verified transactions",
                  features: ["256-bit encryption", "Biometric auth", "Smart contracts"]
                },
                {
                  icon: Zap,
                  title: "AI-Powered Matching",
                  description: "Machine learning algorithms find your perfect match instantly",
                  features: ["Smart recommendations", "Predictive analytics", "Auto-screening"]
                },
                {
                  icon: Globe,
                  title: "Township Network",
                  description: "150+ locations across South Africa, all digitally mapped",
                  features: ["Real-time availability", "GPS integration", "Community insights"]
                },
              ].map((feature, i) => (
                <Card key={i} className="group relative bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all duration-500">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                  <CardContent className="relative p-8">
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
                      <div className="relative bg-gradient-to-br from-emerald-500/20 to-teal-500/20 p-4 rounded-2xl border border-emerald-500/30">
                        <feature.icon className="h-8 w-8 text-emerald-400" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-white/60 mb-6 leading-relaxed">{feature.description}</p>
                    <ul className="space-y-3">
                      {feature.features.map((item, j) => (
                        <li key={j} className="flex items-center text-emerald-400">
                          <CheckCircle className="h-4 w-4 mr-3 flex-shrink-0" />
                          <span className="text-white/80">{item}</span>
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
        <section className="py-32 px-4 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10"></div>
          <div className="container mx-auto relative">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
                Ready to experience the future?
              </h2>
              <p className="text-xl text-white/60 mb-12">
                Join thousands of smart landlords and tenants already using MyYard
              </p>
              <Link href="/auth/register">
                <div className="inline-block group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition duration-300"></div>
                  <Button
                    size="lg"
                    className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white px-12 py-8 rounded-2xl font-black text-xl shadow-2xl"
                  >
                    Launch Application
                    <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-4 border-t border-white/10 bg-black/40 backdrop-blur-xl">
          <div className="container mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Image src="/myyard-logo.svg" alt="MyYard" width={40} height={40} />
                <span className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  MyYard
                </span>
              </div>
              <p className="text-white/60 mb-8">
                Future of Township Living • Powered by Innovation
              </p>
              <p className="text-white/40 text-sm">
                © 2025 MyYard. All rights reserved. Built with ❤️ for South African Communities.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
