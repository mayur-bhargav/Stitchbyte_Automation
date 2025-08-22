"use client";
import Link from "next/link";
import { 
  MdArrowBack, 
  MdPeople, 
  MdTrendingUp, 
  MdSecurity, 
  MdGMobiledata,
  MdCheckCircle,
  MdMessage,
  MdBusiness,
  MdSpeed
} from "react-icons/md";

export default function AboutPage() {
  const stats = [
    {
      icon: MdMessage,
      number: "50M+",
      label: "Messages Sent",
      description: "Delivered monthly across all platforms"
    },
    {
      icon: MdBusiness,
      number: "500+",
      label: "Companies Trust Us",
      description: "From startups to enterprises"
    },
    {
      icon: MdGMobiledata,
      number: "15+",
      label: "Countries",
      description: "Serving businesses worldwide"
    },
    {
      icon: MdSpeed,
      number: "99.9%",
      label: "Uptime",
      description: "Reliable service you can count on"
    }
  ];

  const values = [
    {
      icon: MdPeople,
      title: "Customer First",
      description: "Every decision we make starts with how it benefits our customers and helps them grow their business.",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: MdTrendingUp,
      title: "Innovation",
      description: "We constantly push the boundaries of what's possible in WhatsApp marketing automation.",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: MdSecurity,
      title: "Security & Trust",
      description: "We protect your data with enterprise-grade security and transparent business practices.",
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      icon: MdGMobiledata,
      title: "Global Impact",
      description: "Empowering businesses worldwide to connect with their customers in meaningful ways.",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-2xl font-bold">
                <span className="text-gray-900">Stitch</span>
                <span className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">Byte</span>
              </span>
            </Link>
            
            <Link 
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-[#2A8B8A] transition-colors"
            >
              <MdArrowBack className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
              About StitchByte
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            We're building the future of business communication through intelligent WhatsApp automation.
            Our mission is to help businesses of all sizes connect with their customers in more meaningful ways.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-2xl flex items-center justify-center mb-4 mx-auto">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-[#2A8B8A] mb-2">{stat.number}</div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">{stat.label}</div>
                  <p className="text-gray-600 text-sm">{stat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Founded in 2025, StitchByte emerged from a simple observation: businesses were struggling to 
              scale their customer communication while maintaining personal connections. Our founders, 
              experienced in both technology and business growth, set out to create a platform that would 
              democratize enterprise-level communication tools for businesses of all sizes.
            </p>
          </div>
          
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">What drives us</h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              We believe that every business, regardless of size, should have access to powerful communication 
              tools that help them grow. WhatsApp has become the preferred communication channel for billions 
              of people worldwide, and we're here to help businesses leverage that connection.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our platform combines the intimacy of personal messaging with the scale and intelligence of 
              enterprise automation, enabling businesses to maintain authentic relationships while reaching 
              thousands of customers efficiently.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Values</h2>
            <p className="text-xl text-gray-600">
              The principles that guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className={`w-16 h-16 bg-gradient-to-r ${value.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Join Our Mission</h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            We're always looking for passionate people who share our vision of transforming business communication.
          </p>
          <Link 
            href="/careers"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
          >
            View Open Positions
            <MdArrowBack className="w-5 h-5 rotate-180" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#2A8B8A] via-[#238080] to-[#1e6b6b]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Transform Your Business?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of companies already using StitchByte to grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth/signup"
              className="bg-white text-[#2A8B8A] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Start Free Trial
              <MdCheckCircle className="w-5 h-5" />
            </Link>
            <Link 
              href="/contact"
              className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-[#2A8B8A] transition-all duration-300 flex items-center justify-center gap-2"
            >
              Contact Us
              <MdMessage className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
