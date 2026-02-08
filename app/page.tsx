import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Home, Users, Shield, Star, MapPin, CheckCircle, Heart, Search, MessageCircle, Sparkles } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/30">
      {/* Header */}
      <header className="border-b border-emerald-100/50 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image 
              src="/myyard-logo.svg" 
              alt="MyYard Logo" 
              width={50} 
              height={50}
              className="hover:scale-105 transition-transform duration-200"
            />
            <div>
              <span className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                MyYard
              </span>
              <p className="text-xs text-slate-500 -mt-1 font-medium">Where Community Finds Home</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-teal-600/5 to-emerald-600/5"></div>
        <div className="container mx-auto relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-emerald-200 px-5 py-2.5 font-medium shadow-sm">
              <Sparkles className="w-4 h-4 mr-2" />
              Where Community Finds Home
            </Badge>
            <h1 className="text-6xl md:text-7xl font-black text-slate-800 mb-6 leading-tight">
              Find Your Perfect
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent block mt-2">
                Township Home
              </span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              South Africa's premier rental marketplace connecting landlords and tenants across townships, suburbs, and CBDs. 
              Simple, secure, and built for our communities.
            </p>

            {/* Quick Search Bar */}
            <div className="bg-white rounded-2xl p-6 shadow-xl mb-10 max-w-2xl mx-auto border border-emerald-100">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-600" />
                  <input
                    type="text"
                    placeholder="Search by township, suburb, or area..."
                    className="w-full pl-11 pr-4 py-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-700 placeholder:text-slate-400"
                  />
                </div>
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                  <Search className="w-5 h-5 mr-2" />
                  Search Homes
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link href="/auth/register?role=tenant">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 group"
                >
                  <Users className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                  I'm Looking for a Place
                </Button>
              </Link>
              <Link href="/auth/register?role=landlord">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white px-8 py-6 rounded-xl font-semibold text-lg bg-white shadow-lg hover:shadow-xl transition-all duration-200 group"
                >
                  <Home className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform" />
                  I'm a Property Owner
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 bg-white border-y border-emerald-100">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="group hover:scale-105 transition-transform duration-200">
              <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">2,500+</div>
              <p className="text-slate-600 font-medium">Verified Properties</p>
            </div>
            <div className="group hover:scale-105 transition-transform duration-200">
              <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">15,000+</div>
              <p className="text-slate-600 font-medium">Happy Tenants</p>
            </div>
            <div className="group hover:scale-105 transition-transform duration-200">
              <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">98%</div>
              <p className="text-slate-600 font-medium">Success Rate</p>
            </div>
            <div className="group hover:scale-105 transition-transform duration-200">
              <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">24/7</div>
              <p className="text-slate-600 font-medium">Community Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-800 mb-4">Why Choose MyYard?</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Built specifically for South African township communities with features that matter most to you.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="bg-orange-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-10 w-10 text-orange-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">Secure & Verified</CardTitle>
                <CardDescription className="text-slate-600 text-lg leading-relaxed">
                  Every user is verified with proper documentation. Your safety is our priority.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    ID verification required
                  </li>
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Background checks available
                  </li>
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Secure payment processing
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="bg-orange-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-10 w-10 text-orange-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">Community Focused</CardTitle>
                <CardDescription className="text-slate-600 text-lg leading-relaxed">
                  Designed by and for South African township communities who understand your needs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Local area expertise
                  </li>
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Community recommendations
                  </li>
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Neighborhood insights
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardHeader className="text-center pb-4">
                <div className="bg-orange-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-10 w-10 text-orange-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-800">Easy Communication</CardTitle>
                <CardDescription className="text-slate-600 text-lg leading-relaxed">
                  Connect directly with landlords and tenants through our built-in messaging system.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Instant messaging
                  </li>
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Schedule viewings online
                  </li>
                  <li className="flex items-center text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Real-time notifications
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Role Selection Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-800 mb-4">Get Started Today</h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Join thousands of community members who have found their perfect rental match.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <Card className="hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-orange-50">
              <CardHeader className="text-center pb-6">
                <div className="bg-orange-600 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Users className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-black text-slate-800">For Tenants</CardTitle>
                <CardDescription className="text-lg text-slate-600">
                  Find your perfect township home with verified listings and trusted landlords.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <Star className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-slate-700">Browse thousands of verified properties</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-slate-700">Apply online with instant responses</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-slate-700">Secure payment processing</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-slate-700">Direct landlord communication</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-slate-700">Community reviews and ratings</span>
                  </li>
                </ul>
                <Link href="/auth/register?role=tenant" className="w-full block">
                  <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white py-4 rounded-xl font-semibold text-lg">
                    Join as Tenant
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
              <CardHeader className="text-center pb-6">
                <div className="bg-slate-700 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Home className="h-12 w-12 text-white" />
                </div>
                <CardTitle className="text-3xl font-black text-slate-800">For Landlords</CardTitle>
                <CardDescription className="text-lg text-slate-600">
                  List your properties and connect with reliable, verified tenants in your community.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-4">
                  <li className="flex items-center">
                    <Star className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-slate-700">List unlimited properties for free</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-slate-700">Screen and verify tenant applications</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-slate-700">Collect rent payments securely</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-slate-700">Manage maintenance requests</span>
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-slate-700">Analytics and insights dashboard</span>
                  </li>
                </ul>
                <Link href="/auth/register?role=landlord" className="w-full block">
                  <Button
                    className="w-full border-2 border-slate-700 text-slate-700 hover:bg-slate-700 hover:text-white py-4 rounded-xl font-semibold text-lg bg-transparent"
                    variant="outline"
                  >
                    Join as Landlord
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-orange-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-800 mb-4">What Our Community Says</h2>
            <p className="text-xl text-slate-600">Real stories from real people in our townships.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-orange-500 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 italic">
                  "Found my perfect home in Soweto within a week! The landlord was verified and the process was so
                  smooth."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-orange-600 font-bold">T</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Thabo M.</p>
                    <p className="text-slate-500 text-sm">Tenant, Soweto</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-orange-500 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 italic">
                  "As a landlord, I love how easy it is to find reliable tenants. The verification process gives me
                  peace of mind."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-orange-600 font-bold">N</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Nomsa K.</p>
                    <p className="text-slate-500 text-sm">Landlord, Alexandra</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-orange-500 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 italic">
                  "The community support is amazing. When I had questions, they helped me every step of the way."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                    <span className="text-orange-600 font-bold">S</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Sipho D.</p>
                    <p className="text-slate-500 text-sm">Tenant, Khayelitsha</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-white py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-orange-600 p-2 rounded-xl">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <div>
                  <span className="text-2xl font-black">MyYard</span>
                  <p className="text-xs text-slate-400 -mt-1">Township Rentals</p>
                </div>
              </div>
              <p className="text-slate-400 mb-4">
                Connecting communities through secure township rentals across South Africa.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">For Tenants</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/search" className="hover:text-white">
                    Search Properties
                  </Link>
                </li>
                <li>
                  <Link href="/how-it-works" className="hover:text-white">
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link href="/safety" className="hover:text-white">
                    Safety Tips
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">For Landlords</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/list-property" className="hover:text-white">
                    List Property
                  </Link>
                </li>
                <li>
                  <Link href="/landlord-guide" className="hover:text-white">
                    Landlord Guide
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/community" className="hover:text-white">
                    Community
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 mb-4 md:mb-0">© 2024 MyYard. All rights reserved.</p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-slate-400 hover:text-white">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-slate-400 hover:text-white">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
