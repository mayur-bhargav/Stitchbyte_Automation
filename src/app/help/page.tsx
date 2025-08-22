"use client";
import Link from "next/link";
import { 
  MdArrowBack, 
  MdHelp, 
  MdSearch,
  MdWhatsapp,
  MdSettings,
  MdSecurity,
  MdPayment,
  MdAnalytics,
  MdIntegrationInstructions,
  MdSupport,
  MdArrowForward,
  MdExpandMore,
  MdKeyboardArrowDown
} from "react-icons/md";
import { useState } from "react";

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const categories = [
    {
      icon: MdWhatsapp,
      title: "Getting Started",
      description: "Learn the basics of WhatsApp automation",
      articles: 12,
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: MdSettings,
      title: "Account Setup",
      description: "Configure your account and integrations",
      articles: 8,
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: MdAnalytics,
      title: "Analytics & Reporting",
      description: "Understanding your campaign metrics",
      articles: 6,
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      icon: MdSecurity,
      title: "Security & Privacy",
      description: "Keep your data safe and compliant",
      articles: 5,
      gradient: "from-red-500 to-pink-600"
    },
    {
      icon: MdPayment,
      title: "Billing & Plans",
      description: "Manage your subscription and billing",
      articles: 7,
      gradient: "from-yellow-500 to-orange-600"
    },
    {
      icon: MdIntegrationInstructions,
      title: "API & Integrations",
      description: "Connect with your existing tools",
      articles: 9,
      gradient: "from-teal-500 to-cyan-600"
    }
  ];

  const popularArticles = [
    {
      title: "How to set up your first WhatsApp campaign",
      category: "Getting Started",
      readTime: "5 min read",
      views: 1250
    },
    {
      title: "Understanding WhatsApp Business API limits",
      category: "Account Setup",
      readTime: "3 min read",
      views: 980
    },
    {
      title: "Best practices for message templates",
      category: "Getting Started",
      readTime: "7 min read",
      views: 856
    },
    {
      title: "How to interpret your analytics dashboard",
      category: "Analytics & Reporting",
      readTime: "6 min read",
      views: 742
    },
    {
      title: "Setting up webhooks for real-time updates",
      category: "API & Integrations",
      readTime: "8 min read",
      views: 634
    }
  ];

  const faqs = [
    {
      question: "How do I get started with StitchByte?",
      answer: "Getting started is easy! Sign up for a free trial, connect your WhatsApp Business account, and you can start sending messages within minutes. Our onboarding guide will walk you through each step."
    },
    {
      question: "What are the WhatsApp Business API limits?",
      answer: "WhatsApp has different messaging limits based on your phone number's status. New numbers start with 250 conversations per day, which can increase to 1,000+ based on your phone number's quality rating and message delivery success."
    },
    {
      question: "Can I import my existing contacts?",
      answer: "Yes! You can import contacts via CSV file upload. Make sure your contacts have opted in to receive WhatsApp messages from your business to comply with WhatsApp's policies."
    },
    {
      question: "How much does StitchByte cost?",
      answer: "We offer flexible pricing starting at ₹999/month for our Starter plan. All plans include a 14-day free trial with no credit card required. Check our pricing page for detailed plan comparisons."
    },
    {
      question: "Is my data secure with StitchByte?",
      answer: "Absolutely! We use enterprise-grade security with end-to-end encryption, SOC 2 compliance, and regular security audits. Your data is stored securely and never shared with third parties."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time from your account settings. There are no cancellation fees, and you'll continue to have access until the end of your billing period."
    },
    {
      question: "Do you offer API access?",
      answer: "Yes! Our Professional and Enterprise plans include full API access. You can integrate StitchByte with your existing systems using our RESTful API and webhooks."
    },
    {
      question: "What kind of support do you provide?",
      answer: "We offer email support for all plans, with priority support for Professional plans and 24/7 phone support for Enterprise customers. We also have extensive documentation and video tutorials."
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

      {/* Hero Section with Search */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
              Help Center
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Find answers to your questions and learn how to get the most out of StitchByte.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-8">
            <div className="relative">
              <MdSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, guides, and FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-6 py-4 text-lg rounded-2xl border-2 border-gray-200 focus:border-[#2A8B8A] focus:ring-4 focus:ring-[#2A8B8A]/10 outline-none transition-all duration-200 bg-white shadow-lg"
              />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="text-gray-600">Popular searches:</span>
            {["Setup WhatsApp", "Message Templates", "API Integration", "Billing"].map((term) => (
              <button
                key={term}
                className="bg-white/80 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-lg hover:bg-white hover:text-[#2A8B8A] transition-all duration-200 border border-gray-200"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Browse by Category</h2>
            <p className="text-xl text-gray-600">
              Find the help you need organized by topic
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 group cursor-pointer">
                  <div className={`w-16 h-16 bg-gradient-to-r ${category.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#2A8B8A] transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {category.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{category.articles} articles</span>
                    <MdArrowForward className="w-5 h-5 text-gray-400 group-hover:text-[#2A8B8A] group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Articles */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Popular Articles</h2>
            <p className="text-xl text-gray-600">
              The most helpful articles according to our community
            </p>
          </div>

          <div className="space-y-4">
            {popularArticles.map((article, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#2A8B8A] transition-colors">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="bg-gray-100 px-3 py-1 rounded-full">{article.category}</span>
                      <span>{article.readTime}</span>
                      <span>{article.views} views</span>
                    </div>
                  </div>
                  <MdArrowForward className="w-5 h-5 text-gray-400 group-hover:text-[#2A8B8A] group-hover:translate-x-1 transition-all duration-300" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-600">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <h3 className="text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </h3>
                  <MdKeyboardArrowDown 
                    className={`w-6 h-6 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <p className="text-gray-600 leading-relaxed pt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-gradient-to-r from-[#2A8B8A] via-[#238080] to-[#1e6b6b]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <MdSupport className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">Still Need Help?</h2>
          <p className="text-xl text-white/90 mb-8">
            Our support team is here to help you succeed. Get personalized assistance from our experts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact"
              className="bg-white text-[#2A8B8A] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Contact Support
              <MdArrowForward className="w-5 h-5" />
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-[#2A8B8A] transition-all duration-300 flex items-center justify-center gap-2">
              Live Chat
              <MdSupport className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
