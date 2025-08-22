"use client";
import Link from "next/link";
import { 
  MdArrowBack, 
  MdGavel,
  MdDescription,
  MdInfo,
  MdSecurity,
  MdPayment,
  MdCancel,
  MdWarning,
  MdContactMail,
  MdUpdate,
  MdPolicy,
  MdSupport,
  MdBusiness,
  MdLock,
  MdScience
} from "react-icons/md";

export default function TermsPage() {
  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: MdGavel,
      content: [
        "By accessing or using StitchByte's services, you agree to be bound by these Terms of Service and all applicable laws and regulations.",
        "If you do not agree with any part of these terms, you may not use our services.",
        "These terms apply to all users, including visitors, customers, and other users of the service."
      ]
    },
    {
      id: "service-description",
      title: "Service Description",
      icon: MdDescription,
      content: [
        "StitchByte provides WhatsApp Business API automation services, including message sending, contact management, and campaign analytics.",
        "Our service acts as an intermediary between your business applications and the WhatsApp Business API.",
        "We provide APIs, webhooks, and dashboard interfaces to manage your WhatsApp communications."
      ]
    },
    {
      id: "account-registration",
      title: "Account Registration",
      icon: MdBusiness,
      content: [
        "You must provide accurate, current, and complete information during registration.",
        "You are responsible for maintaining the confidentiality of your account credentials.",
        "You must notify us immediately of any unauthorized use of your account.",
        "One person or legal entity may not maintain more than one free account."
      ]
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use Policy",
      icon: MdPolicy,
      content: [
        "You may not use our service for any unlawful or prohibited activities.",
        "Spam, unsolicited marketing, or mass messaging without proper consent is strictly prohibited.",
        "You must comply with WhatsApp's Terms of Service and Business Policy.",
        "Content must not be harmful, threatening, abusive, or violate others' rights."
      ]
    },
    {
      id: "whatsapp-compliance",
      title: "WhatsApp Compliance",
      icon: MdSecurity,
      content: [
        "You must obtain proper consent before sending messages to recipients.",
        "All messages must comply with WhatsApp's messaging policies and guidelines.",
        "You are responsible for maintaining opt-in records and honoring opt-out requests.",
        "Violation of WhatsApp policies may result in account suspension or termination."
      ]
    },
    {
      id: "payment-terms",
      title: "Payment and Billing",
      icon: MdPayment,
      content: [
        "Subscription fees are billed in advance on a monthly or annual basis.",
        "All fees are non-refundable except as expressly stated in our refund policy.",
        "We reserve the right to change pricing with 30 days written notice.",
        "Failure to pay fees may result in service suspension or termination."
      ]
    },
    {
      id: "data-privacy",
      title: "Data and Privacy",
      icon: MdLock,
      content: [
        "You retain ownership of all data you submit to our service.",
        "We will protect your data in accordance with our Privacy Policy.",
        "You grant us a limited license to process your data to provide the service.",
        "You are responsible for ensuring you have the right to share data with us."
      ]
    },
    {
      id: "service-availability",
      title: "Service Availability",
      icon: MdSupport,
      content: [
        "We strive to maintain 99.9% uptime but do not guarantee uninterrupted service.",
        "Scheduled maintenance will be announced in advance when possible.",
        "We are not liable for service interruptions caused by third parties or circumstances beyond our control.",
        "Service level agreements are detailed in your specific subscription plan."
      ]
    },
    {
      id: "termination",
      title: "Termination",
      icon: MdCancel,
      content: [
        "You may terminate your account at any time through your account settings.",
        "We may terminate or suspend your account for violation of these terms.",
        "Upon termination, your right to use the service ceases immediately.",
        "We will retain data as required by law and our data retention policies."
      ]
    },
    {
      id: "limitations",
      title: "Limitations of Liability",
      icon: MdWarning,
      content: [
        "Our liability is limited to the amount you paid for the service in the preceding 12 months.",
        "We are not liable for indirect, incidental, special, or consequential damages.",
        "Some jurisdictions do not allow limitation of liability, so these limitations may not apply to you.",
        "You acknowledge that you use the service at your own risk."
      ]
    }
  ];

  const keyTerms = [
    {
      term: "Service Level Agreement",
      description: "99.9% uptime guarantee with service credits for outages"
    },
    {
      term: "Data Retention",
      description: "Message data retained for 30 days, account data until termination"
    },
    {
      term: "Rate Limits",
      description: "API calls limited based on your subscription plan"
    },
    {
      term: "Support Response",
      description: "24-48 hour response time for support requests"
    }
  ];

  const prohibitedUses = [
    "Sending spam or unsolicited messages",
    "Violating WhatsApp's terms of service",
    "Sharing illegal or harmful content",
    "Impersonating others or providing false information",
    "Attempting to hack or compromise our systems",
    "Reselling or redistributing our service without permission",
    "Using the service for competitive intelligence",
    "Violating any applicable laws or regulations"
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
          <div className="mb-8">
            <MdGavel className="w-20 h-20 text-[#2A8B8A] mx-auto mb-6" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
              Terms of Service
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Please read these Terms of Service carefully before using StitchByte. 
            These terms govern your use of our WhatsApp automation platform and services.
          </p>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
            <div className="flex items-center justify-center gap-4 mb-4">
              <MdUpdate className="w-6 h-6 text-[#2A8B8A]" />
              <span className="text-lg font-semibold text-gray-900">
                Last Updated: December 15, 2024
              </span>
            </div>
            <p className="text-gray-600">
              These terms are effective immediately and apply to all users of StitchByte services.
            </p>
          </div>
        </div>
      </section>

      {/* Key Terms Overview */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Terms Overview</h2>
            <p className="text-lg text-gray-600">Important terms you should know about our service</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {keyTerms.map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{item.term}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Table of Contents</h2>
            <p className="text-lg text-gray-600">Quick navigation to different sections</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <a
                    key={index}
                    href={`#${section.id}`}
                    className="flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors duration-200 group"
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-lg flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 group-hover:text-[#2A8B8A] transition-colors">
                      {section.title}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Introduction */}
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center">
                <MdInfo className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Introduction</h2>
            </div>
            
            <div className="prose prose-lg prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-6">
                Welcome to StitchByte! These Terms of Service ("Terms") govern your use of StitchByte's 
                WhatsApp Business API automation platform and related services (collectively, the "Service") 
                operated by StitchByte Technologies Private Limited ("StitchByte," "we," "us," or "our").
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree 
                with any part of these terms, then you may not access the Service. This Terms of Service 
                agreement is licensed under Creative Commons Share Alike.
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-amber-900 mb-3">Important Legal Notice</h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  These Terms constitute a legally binding agreement between you and StitchByte. 
                  Please read them carefully and contact us if you have any questions before using our Service.
                </p>
              </div>
            </div>
          </div>

          {/* Terms Sections */}
          <div className="space-y-16">
            {sections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <div key={index} id={section.id} className="scroll-mt-20">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>
                  </div>
                  
                  <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100">
                    <ul className="space-y-4">
                      {section.content.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start gap-3 text-gray-600">
                          <div className="w-2 h-2 bg-[#2A8B8A] rounded-full mt-2 flex-shrink-0"></div>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Prohibited Uses */}
          <div className="mt-20 pt-16 border-t border-gray-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <MdWarning className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Prohibited Uses</h2>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8">
              <p className="text-red-800 mb-6 leading-relaxed">
                The following activities are strictly prohibited when using StitchByte services. 
                Violation of these restrictions may result in immediate account suspension or termination.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prohibitedUses.map((use, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <MdCancel className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-red-800 text-sm leading-relaxed">{use}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Disclaimers */}
          <div className="mt-16 pt-16 border-t border-gray-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center">
                <MdScience className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Disclaimers</h2>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Service "As Is"</h3>
                  <p className="text-gray-600 leading-relaxed">
                    The Service is provided on an "as is" and "as available" basis. StitchByte makes no 
                    representations or warranties of any kind, express or implied, regarding the operation 
                    of the Service or the information included on the Service.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Third-Party Dependencies</h3>
                  <p className="text-gray-600 leading-relaxed">
                    Our Service depends on third-party services, including WhatsApp Business API. 
                    We are not responsible for the availability, functionality, or policies of these 
                    third-party services.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">No Warranty</h3>
                  <p className="text-gray-600 leading-relaxed">
                    StitchByte disclaims all warranties, express or implied, including but not limited 
                    to implied warranties of merchantability and fitness for a particular purpose.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mt-16 pt-16 border-t border-gray-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center">
                <MdContactMail className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Contact Information</h2>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <p className="text-gray-600 leading-relaxed mb-6">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MdContactMail className="w-5 h-5 text-[#2A8B8A]" />
                  <span className="text-gray-900 font-semibold">Email:</span>
                  <span className="text-gray-600">legal@stitchbyte.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MdSupport className="w-5 h-5 text-[#2A8B8A]" />
                  <span className="text-gray-900 font-semibold">Support:</span>
                  <span className="text-gray-600">support@stitchbyte.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MdBusiness className="w-5 h-5 text-[#2A8B8A]" />
                  <span className="text-gray-900 font-semibold">Company:</span>
                  <span className="text-gray-600">StitchByte Technologies Private Limited</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm leading-relaxed">
                  <strong>Legal Disputes:</strong> These Terms are governed by the laws of India. 
                  Any disputes will be resolved in the courts of Mumbai, Maharashtra.
                </p>
              </div>
            </div>
          </div>

          {/* Changes to Terms */}
          <div className="mt-16 pt-16 border-t border-gray-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center">
                <MdUpdate className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Changes to Terms</h2>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <p className="text-gray-600 leading-relaxed mb-6">
                We reserve the right to modify these Terms at any time. When we make changes, we will:
              </p>
              
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3 text-gray-600">
                  <div className="w-2 h-2 bg-[#2A8B8A] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Update the "Last Updated" date at the top of these Terms</span>
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <div className="w-2 h-2 bg-[#2A8B8A] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Notify you via email for material changes</span>
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <div className="w-2 h-2 bg-[#2A8B8A] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Post notices on our website and service dashboard</span>
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <div className="w-2 h-2 bg-[#2A8B8A] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Provide at least 30 days notice for material changes</span>
                </li>
              </ul>
              
              <p className="text-gray-600 leading-relaxed">
                Your continued use of the Service after any changes constitutes acceptance of the new Terms. 
                If you do not agree to the modified Terms, you must stop using the Service.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#2A8B8A] via-[#238080] to-[#1e6b6b]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <MdGavel className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">Questions About Terms?</h2>
          <p className="text-xl text-white/90 mb-8">
            Our legal team is here to help clarify any questions you may have about these Terms of Service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact"
              className="bg-white text-[#2A8B8A] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Contact Legal Team
              <MdContactMail className="w-5 h-5" />
            </Link>
            <Link 
              href="/privacy"
              className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-[#2A8B8A] transition-all duration-300 flex items-center justify-center gap-2"
            >
              View Privacy Policy
              <MdPolicy className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
