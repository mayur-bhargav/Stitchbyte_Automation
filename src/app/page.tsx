"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  MdMessage, 
  MdAnalytics, 
  MdNoFlash, 
  MdBusiness, 
  MdSecurity, 
  MdPayment,
  MdArrowForward,
  MdPlayArrow,
  MdCheckCircle,
  MdStar,
  MdMenu,
  MdClose,
  MdWhatsapp,
  MdGroup,
  MdTrendingUp,
  MdSpeed,
  MdShield,
  MdCloud,
  MdSupport,
  MdContactPhone,
  MdLocationOn,
  MdEmail,
  MdPhone,
  MdHelp,
  MdExpandMore,
  MdStore,
  MdRocket
} from "react-icons/md";

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const features = [
    {
      icon: MdWhatsapp,
      title: "WhatsApp Automation",
      description: "Send bulk messages, manage campaigns, and automate your WhatsApp marketing with ease.",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: MdAnalytics,
      title: "Advanced Analytics",
      description: "Track delivery rates, engagement metrics, and campaign performance in real-time.",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: MdGroup,
      title: "Smart Reboost",
      description: "Automatically retry failed messages and maximize your campaign reach.",
      gradient: "from-yellow-500 to-orange-600"
    },
    {
      icon: MdBusiness,
      title: "Multi-Company",
      description: "Manage multiple companies and teams with secure data isolation.",
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      icon: MdSecurity,
      title: "Enterprise Security",
      description: "Bank-level encryption, secure authentication, and compliance-ready features.",
      gradient: "from-red-500 to-pink-600"
    },
    {
      icon: MdPayment,
      title: "Flexible Billing",
      description: "Pay-as-you-use pricing with transparent billing and multiple payment options.",
      gradient: "from-teal-500 to-cyan-600"
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "999",
      period: "month",
      description: "Perfect for small businesses getting started",
      features: [
        "5,000 messages/month",
        "Basic automation",
        "Standard support",
        "WhatsApp integration",
        "Basic analytics"
      ],
      popular: false,
      gradient: "from-gray-500 to-gray-600"
    },
    {
      name: "Professional",
      price: "2,999",
      period: "month", 
      description: "Best for growing businesses",
      features: [
        "25,000 messages/month",
        "Advanced automation",
        "Priority support",
        "Multi-company management",
        "Advanced analytics",
        "Custom templates",
        "API access"
      ],
      popular: true,
      gradient: "from-[#2A8B8A] to-[#238080]"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        "Unlimited messages",
        "Custom automation",
        "24/7 dedicated support",
        "White-label solution",
        "Advanced security",
        "Custom integrations",
        "SLA guarantee"
      ],
      popular: false,
      gradient: "from-purple-600 to-indigo-700"
    }
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      company: "TechSoft Solutions",
      message: "StitchByte transformed our customer engagement. We've seen 300% increase in response rates!",
      rating: 5,
      role: "CEO"
    },
    {
      name: "Priya Sharma",
      company: "E-Commerce Plus",  
      message: "The automation features saved us 20 hours per week. Best investment we've made!",
      rating: 5,
      role: "Marketing Director"
    },
    {
      name: "Amit Patel",
      company: "Digital Marketing Pro",
      message: "Multi-company support is perfect for our agency. We manage 50+ clients effortlessly.",
      rating: 5,
      role: "Founder"
    }
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden scroll-smooth">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-100' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold">
                <span className="text-gray-900">Stitch</span>
                <span className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">Byte</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-[#2A8B8A] transition-colors font-medium scroll-smooth">Features</a>
              <a href="#pricing" className="text-gray-700 hover:text-[#2A8B8A] transition-colors font-medium scroll-smooth">Pricing</a>
              <a href="#testimonials" className="text-gray-700 hover:text-[#2A8B8A] transition-colors font-medium scroll-smooth">Testimonials</a>
              <a href="#contact" className="text-gray-700 hover:text-[#2A8B8A] transition-colors font-medium scroll-smooth">Contact</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link 
                href="/auth/signin" 
                className="text-gray-700 hover:text-[#2A8B8A] font-semibold transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                Sign In
              </Link>
              <Link 
                href="/auth/signup" 
                className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-6 py-2.5 rounded-xl font-semibold hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              >
                Get Started
                <MdArrowForward className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-[#2A8B8A] transition-colors p-2"
              >
                {mobileMenuOpen ? <MdClose className="w-6 h-6" /> : <MdMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
              <div className="px-4 py-6 space-y-4">
                <a href="#features" className="block text-gray-700 hover:text-[#2A8B8A] transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>Features</a>
                <a href="#pricing" className="block text-gray-700 hover:text-[#2A8B8A] transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
                <a href="#testimonials" className="block text-gray-700 hover:text-[#2A8B8A] transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>Testimonials</a>
                <a href="#contact" className="block text-gray-700 hover:text-[#2A8B8A] transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>Contact</a>
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Link href="/auth/signin" className="block text-gray-700 hover:text-[#2A8B8A] font-semibold transition-colors">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="block bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-6 py-2.5 rounded-xl font-semibold text-center">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#2A8B8A]/20 to-[#238080]/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-6 py-2 mb-8 shadow-lg">
              <MdTrendingUp className="w-4 h-4 text-[#2A8B8A]" />
              <span className="text-sm font-semibold text-gray-700">Trusted by 500+ Growing Companies</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
                WhatsApp Marketing
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#238080] to-indigo-600 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Scale your business with intelligent WhatsApp automation. Send bulk messages, 
              track engagement, and grow your customer relationships with enterprise-grade security.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link 
                href="/auth/signup"
                className="group bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center gap-3"
              >
                <MdWhatsapp className="w-6 h-6" />
                Start Free Trial
                <MdArrowForward className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button className="group bg-white/90 backdrop-blur-sm text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg border-2 border-gray-200 hover:border-[#2A8B8A] hover:text-[#2A8B8A] transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-3">
                <MdPlayArrow className="w-6 h-6" />
                Watch Demo
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </button>
            </div>

            {/* Stats with icons */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl mb-4 mx-auto">
                  <MdMessage className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-[#2A8B8A] mb-2">50,000+</div>
                <div className="text-gray-600 font-medium">Messages Sent Daily</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl mb-4 mx-auto">
                  <MdCheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-[#2A8B8A] mb-2">98.5%</div>
                <div className="text-gray-600 font-medium">Delivery Rate</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl mb-4 mx-auto">
                  <MdBusiness className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-[#2A8B8A] mb-2">500+</div>
                <div className="text-gray-600 font-medium">Happy Companies</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl mb-4 mx-auto">
                  <MdSupport className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-[#2A8B8A] mb-2">24/7</div>
                <div className="text-gray-600 font-medium">Expert Support</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2A8B8A]/10 to-[#238080]/10 rounded-full px-6 py-2 mb-6">
              <MdSpeed className="w-4 h-4 text-[#2A8B8A]" />
              <span className="text-sm font-semibold text-[#2A8B8A]">Powerful Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
                Scale
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed for modern businesses. From small startups to enterprise companies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="group bg-white p-8 rounded-3xl border border-gray-100 hover:border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 relative overflow-hidden">
                  {/* Background gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
                  
                  <div className="relative z-10">
                    <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-[#2A8B8A] transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative element */}
                  <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                </div>
              );
            })}
          </div>

          {/* Additional features showcase */}
          <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shrink-0">
                  <MdCloud className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Cloud-Based Infrastructure</h3>
                  <p className="text-gray-600">99.9% uptime with auto-scaling servers worldwide for maximum reliability.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <MdShield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Advanced Security</h3>
                  <p className="text-gray-600">End-to-end encryption, SOC 2 compliance, and enterprise-grade security.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                  <MdTrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Insights</h3>
                  <p className="text-gray-600">Live dashboards with actionable insights to optimize your campaigns.</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl">
                <div className="bg-gray-800 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded w-3/4"></div>
                    <div className="h-4 bg-gray-600 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-600 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="text-center">
                  <MdAnalytics className="w-12 h-12 text-[#2A8B8A] mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Dashboard Preview</h3>
                  <p className="text-gray-400">Intuitive interface for managing all your campaigns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2A8B8A]/10 to-[#238080]/10 rounded-full px-6 py-2 mb-6">
              <MdPayment className="w-4 h-4 text-[#2A8B8A]" />
              <span className="text-sm font-semibold text-[#2A8B8A]">Simple Pricing</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
                Perfect Plan
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start with our free trial and scale as you grow. All plans include core features with no hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 hover:border-[#2A8B8A]/50 transition-all duration-300 hover:shadow-2xl group relative overflow-hidden">
              <div className="relative z-10 p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <MdSpeed className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                  <div className="text-4xl font-bold text-[#2A8B8A] mb-2">₹999</div>
                  <p className="text-gray-600">per month</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Up to 5,000 messages/month</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">10,000 contacts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">5 broadcast campaigns</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Basic automation</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Email support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Analytics dashboard</span>
                  </div>
                </div>

                <Link 
                  href="/auth/signup"
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  Get Started
                  <MdArrowForward className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <p className="text-center text-sm text-gray-500 mt-4">
                  14-day free trial • No setup fees
                </p>
              </div>
            </div>

            {/* Professional Plan - Most Popular */}
            <div className="bg-white rounded-3xl border-2 border-[#2A8B8A] hover:border-[#238080] transition-all duration-300 hover:shadow-2xl group relative overflow-hidden scale-105">
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                <span className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                  Most Popular
                </span>
              </div>

              {/* Gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#2A8B8A]/5 to-[#238080]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>

              <div className="relative z-10 p-8 pt-12">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <MdBusiness className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
                  <div className="text-4xl font-bold text-[#2A8B8A] mb-2">₹2,999</div>
                  <p className="text-gray-600">per month</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Up to 25,000 messages/month</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">50,000 contacts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited broadcasts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Advanced automation</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Priority support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Advanced analytics</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Multi-user access</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">API access</span>
                  </div>
                </div>

                <Link 
                  href="/auth/signup"
                  className="w-full bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white py-3 px-6 rounded-xl font-semibold hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2 group"
                >
                  Start Free Trial
                  <MdArrowForward className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <p className="text-center text-sm text-gray-500 mt-4">
                  14-day free trial • No setup fees
                </p>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-3xl border-2 border-gray-200 hover:border-[#2A8B8A]/50 transition-all duration-300 hover:shadow-2xl group relative overflow-hidden">
              <div className="relative z-10 p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300">
                    <MdSecurity className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                  <div className="text-4xl font-bold text-[#2A8B8A] mb-2">₹9,999</div>
                  <p className="text-gray-600">per month</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited messages</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited contacts</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Unlimited everything</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Enterprise automation</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">24/7 phone support</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Custom integrations</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Dedicated account manager</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <MdCheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">SLA guarantee</span>
                  </div>
                </div>

                <Link 
                  href="/auth/signup"
                  className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  Contact Sales
                  <MdArrowForward className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                <p className="text-center text-sm text-gray-500 mt-4">
                  Custom setup • Dedicated onboarding
                </p>
              </div>
            </div>
          </div>

          {/* Pricing FAQ */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Pricing FAQ</h3>
              <p className="text-gray-600">Common questions about our pricing and plans</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center shrink-0">
                    <MdPayment className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">What payment methods do you accept?</h4>
                    <p className="text-gray-600 text-sm">We accept all major credit cards, debit cards, UPI, and net banking through our secure payment partner Razorpay.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shrink-0">
                    <MdSecurity className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Is my payment information secure?</h4>
                    <p className="text-gray-600 text-sm">Yes! We use bank-level encryption and never store your card details. All payments are processed securely by Razorpay.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                    <MdTrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Can I upgrade or downgrade anytime?</h4>
                    <p className="text-gray-600 text-sm">Absolutely! You can change your plan anytime from your dashboard. Changes take effect immediately with prorated billing.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <MdSupport className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">What if I need more messages?</h4>
                    <p className="text-gray-600 text-sm">You can purchase additional message credits or upgrade to a higher plan. We'll notify you before you reach your limit.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center justify-center gap-8 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-2">
                <MdSecurity className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">SSL Encrypted</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <MdShield className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">SOC 2 Compliant</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <MdCheckCircle className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">GDPR Ready</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-[#2A8B8A]/10 to-[#238080]/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-2xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-6 py-2 mb-6">
              <MdStar className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold text-gray-700">Customer Stories</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trusted by{" "}
              <span className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
                Growing Companies
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              See what our customers say about their transformation with StitchByte
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="group bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/50 relative overflow-hidden">
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2A8B8A]/5 to-[#238080]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl"></div>
                
                <div className="relative z-10">
                  {/* Rating stars */}
                  <div className="flex text-yellow-400 mb-6">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <MdStar key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>

                  <blockquote className="text-gray-700 mb-6 leading-relaxed italic text-lg group-hover:text-gray-800 transition-colors duration-300">
                    "{testimonial.message}"
                  </blockquote>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 group-hover:text-[#2A8B8A] transition-colors duration-300">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-gray-500">{testimonial.company}</div>
                    </div>
                  </div>
                </div>

                {/* Decorative quote mark */}
                <div className="absolute top-6 right-6 text-6xl text-[#2A8B8A]/10 font-serif leading-none">
                  "
                </div>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-8 font-medium">Trusted by companies worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {/* Placeholder for company logos */}
              <div className="w-32 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 font-semibold">Company</span>
              </div>
              <div className="w-32 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 font-semibold">Business</span>
              </div>
              <div className="w-32 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 font-semibold">Enterprise</span>
              </div>
              <div className="w-32 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 font-semibold">Startup</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#2A8B8A] via-[#238080] to-[#1e6b6b] relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-black/10 to-transparent"></div>
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-2 mb-8">
            <MdCheckCircle className="w-4 h-4 text-white" />
            <span className="text-sm font-semibold text-white">No Credit Card Required</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Business?
            </span>
          </h2>
          <p className="text-xl text-white/90 mb-10 leading-relaxed">
            Join thousands of companies already using StitchByte to grow their business.
            Start your free trial today and see results in minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link 
              href="/auth/signup"
              className="group bg-white text-[#2A8B8A] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <MdWhatsapp className="w-6 h-6" />
              Start Free Trial - No Credit Card Required
              <MdArrowForward className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <MdCheckCircle className="w-4 h-4 text-green-300" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <MdCheckCircle className="w-4 h-4 text-green-300" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center gap-2">
              <MdCheckCircle className="w-4 h-4 text-green-300" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* Social proof */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="flex items-center justify-center gap-6 text-white/70">
              <div className="flex items-center gap-2">
                <MdStar className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold">4.9/5</span>
                <span className="text-sm">on G2</span>
              </div>
              <div className="w-px h-4 bg-white/30"></div>
              <div className="flex items-center gap-2">
                <MdTrendingUp className="w-5 h-5 text-green-300" />
                <span className="font-semibold">500+</span>
                <span className="text-sm">companies</span>
              </div>
              <div className="w-px h-4 bg-white/30"></div>
              <div className="flex items-center gap-2">
                <MdSupport className="w-5 h-5 text-blue-300" />
                <span className="font-semibold">24/7</span>
                <span className="text-sm">support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2A8B8A]/10 to-[#238080]/10 rounded-full px-6 py-2 mb-6">
              <MdContactPhone className="w-4 h-4 text-[#2A8B8A]" />
              <span className="text-sm font-semibold text-[#2A8B8A]">Get In Touch</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Get <span className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">Started?</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions? Need help getting started? Our team is here to help you transform your business with WhatsApp automation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Contact Form */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <MdMessage className="w-6 h-6 text-[#2A8B8A]" />
                Send us a Message
              </h3>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2A8B8A] focus:ring-4 focus:ring-[#2A8B8A]/10 transition-all duration-200 outline-none"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2A8B8A] focus:ring-4 focus:ring-[#2A8B8A]/10 transition-all duration-200 outline-none"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2A8B8A] focus:ring-4 focus:ring-[#2A8B8A]/10 transition-all duration-200 outline-none"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2A8B8A] focus:ring-4 focus:ring-[#2A8B8A]/10 transition-all duration-200 outline-none"
                    placeholder="Your Company Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#2A8B8A] focus:ring-4 focus:ring-[#2A8B8A]/10 transition-all duration-200 outline-none resize-none"
                    placeholder="Tell us about your project and how we can help..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white py-3 px-6 rounded-xl font-semibold hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  Send Message
                  <MdArrowForward className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-[#2A8B8A]/5 to-[#238080]/5 rounded-3xl p-8 border border-[#2A8B8A]/10">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <MdLocationOn className="w-6 h-6 text-[#2A8B8A]" />
                  Get in Touch
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center">
                      <MdEmail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Email Us</h4>
                      <p className="text-gray-600">support@stitchbyte.com</p>
                      <p className="text-gray-600">sales@stitchbyte.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                      <MdPhone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Call Us</h4>
                      <p className="text-gray-600">+91 98765 43210</p>
                      <p className="text-gray-600">Mon-Fri, 9AM-6PM IST</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <MdWhatsapp className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">WhatsApp</h4>
                      <p className="text-gray-600">+91 98765 43210</p>
                      <p className="text-gray-600">Quick support & demos</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <MdLocationOn className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Visit Us</h4>
                      <p className="text-gray-600">Business Hub, Tech Park</p>
                      <p className="text-gray-600">Mumbai, Maharashtra 400001</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <MdHelp className="w-5 h-5 text-[#2A8B8A]" />
                  Quick Help
                </h3>
                <div className="space-y-4">
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-900">How quickly can I get started?</span>
                      <MdExpandMore className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-2 p-3 text-gray-600 text-sm">
                      You can get started in under 5 minutes! Sign up, connect your WhatsApp Business account, and start sending messages immediately.
                    </div>
                  </details>
                  
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-900">Do you offer free trials?</span>
                      <MdExpandMore className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-2 p-3 text-gray-600 text-sm">
                      Yes! We offer a 14-day free trial with full access to all features. No credit card required to get started.
                    </div>
                  </details>
                  
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-900">Is my data secure?</span>
                      <MdExpandMore className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="mt-2 p-3 text-gray-600 text-sm">
                      Absolutely! We use enterprise-grade security with end-to-end encryption, SOC 2 compliance, and regular security audits.
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
            {/* Company info */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-2xl font-bold">
                  <span className="text-white">Stitch</span>
                  <span className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">Byte</span>
                </span>
              </div>
              <p className="text-gray-400 mb-6 leading-relaxed max-w-md">
                The most powerful WhatsApp marketing platform for growing businesses. 
                Scale your customer engagement with enterprise-grade automation.
              </p>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-800 hover:bg-[#2A8B8A] rounded-lg flex items-center justify-center transition-colors duration-300 cursor-pointer">
                  <MdWhatsapp className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 hover:bg-[#2A8B8A] rounded-lg flex items-center justify-center transition-colors duration-300 cursor-pointer">
                  <MdBusiness className="w-5 h-5" />
                </div>
                <div className="w-10 h-10 bg-gray-800 hover:bg-[#2A8B8A] rounded-lg flex items-center justify-center transition-colors duration-300 cursor-pointer">
                  <MdSupport className="w-5 h-5" />
                </div>
              </div>
            </div>
            
            {/* Product links */}
            <div>
              <h3 className="font-bold mb-6 text-white flex items-center gap-2">
                <MdSpeed className="w-4 h-4 text-[#2A8B8A]" />
                Product
              </h3>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                  <MdArrowForward className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Features
                </a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                  <MdArrowForward className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Pricing
                </a></li>
                <li><Link href="/api-docs" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                  <MdArrowForward className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  API
                </Link></li>
                <li><Link href="/integrations" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                  <MdArrowForward className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Integrations
                </Link></li>
              </ul>
            </div>
            
            {/* Company links */}
            <div>
              <h3 className="font-bold mb-6 text-white flex items-center gap-2">
                <MdBusiness className="w-4 h-4 text-[#2A8B8A]" />
                Company
              </h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                  <MdArrowForward className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  About
                </Link></li>
                <li><Link href="/blog" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                  <MdArrowForward className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Blog
                </Link></li>
                <li><Link href="/careers" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                  <MdArrowForward className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Careers
                </Link></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                  <MdArrowForward className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Contact
                </a></li>
              </ul>
            </div>
            
            {/* Support links */}
            <div>
              <h3 className="font-bold mb-6 text-white flex items-center gap-2">
                <MdSupport className="w-4 h-4 text-[#2A8B8A]" />
                Support
              </h3>
              <ul className="space-y-3">
                <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                  <MdArrowForward className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Help Center
                </Link></li>
                <li><Link href="/api-docs" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                  <MdArrowForward className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Documentation
                </Link></li>
                <li><Link href="/status" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                  <MdArrowForward className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Status
                </Link></li>
                <li><Link href="/security" className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group">
                  <MdArrowForward className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  Security
                </Link></li>
              </ul>
            </div>
          </div>
          
          {/* Bottom section */}
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-6 text-gray-400 text-sm">
                <p>&copy; 2025 StitchByte. All rights reserved.</p>
                <div className="flex items-center gap-4">
                  <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                  <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <MdSecurity className="w-4 h-4 text-green-400" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <MdShield className="w-4 h-4 text-blue-400" />
                  <span>GDPR Ready</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
