"use client";
import Link from "next/link";
import { 
  MdArrowBack, 
  MdPrivacyTip,
  MdPolicy,
  MdInfo,
  MdSecurity,
  MdPersonPin,
  MdContactMail,
  MdStorage,
  MdShare,
  MdDeleteForever,
  MdUpdate,
  MdGavel
} from "react-icons/md";

export default function PrivacyPage() {
  const sections = [
    {
      id: "information-collection",
      title: "Information We Collect",
      icon: MdPersonPin,
      content: [
        {
          subtitle: "Account Information",
          details: [
            "Name, email address, and contact information",
            "Company details and billing information",
            "Authentication credentials and API keys"
          ]
        },
        {
          subtitle: "Usage Data",
          details: [
            "Message sending patterns and volume",
            "API usage and performance metrics",
            "Feature usage and engagement analytics"
          ]
        },
        {
          subtitle: "WhatsApp Data",
          details: [
            "Phone numbers of message recipients",
            "Message content and media files",
            "Delivery status and read receipts"
          ]
        }
      ]
    },
    {
      id: "data-usage",
      title: "How We Use Your Data",
      icon: MdStorage,
      content: [
        {
          subtitle: "Service Provision",
          details: [
            "Deliver WhatsApp messaging services",
            "Process and route messages to recipients",
            "Provide customer support and technical assistance"
          ]
        },
        {
          subtitle: "Service Improvement",
          details: [
            "Analyze usage patterns to improve features",
            "Optimize system performance and reliability",
            "Develop new features and capabilities"
          ]
        },
        {
          subtitle: "Legal and Security",
          details: [
            "Comply with legal obligations and regulations",
            "Prevent fraud and abuse of our services",
            "Maintain security and protect user data"
          ]
        }
      ]
    },
    {
      id: "data-sharing",
      title: "Data Sharing and Disclosure",
      icon: MdShare,
      content: [
        {
          subtitle: "WhatsApp Inc.",
          details: [
            "Message content is transmitted to WhatsApp for delivery",
            "We comply with WhatsApp's Business API terms",
            "WhatsApp has its own privacy policy for message handling"
          ]
        },
        {
          subtitle: "Service Providers",
          details: [
            "Cloud hosting providers for data storage",
            "Payment processors for billing services",
            "Analytics providers for service improvement"
          ]
        },
        {
          subtitle: "Legal Requirements",
          details: [
            "Response to legal process and court orders",
            "Compliance with regulatory requirements",
            "Protection of rights and safety"
          ]
        }
      ]
    },
    {
      id: "data-security",
      title: "Data Security",
      icon: MdSecurity,
      content: [
        {
          subtitle: "Encryption",
          details: [
            "All data encrypted in transit using TLS 1.3",
            "Data at rest encrypted using AES-256",
            "Secure key management practices"
          ]
        },
        {
          subtitle: "Access Controls",
          details: [
            "Role-based access control for all systems",
            "Multi-factor authentication required",
            "Regular access reviews and audits"
          ]
        },
        {
          subtitle: "Monitoring",
          details: [
            "24/7 security monitoring and alerting",
            "Regular security assessments and testing",
            "Incident response procedures"
          ]
        }
      ]
    },
    {
      id: "data-retention",
      title: "Data Retention",
      icon: MdDeleteForever,
      content: [
        {
          subtitle: "Message Data",
          details: [
            "Message content stored for 30 days for delivery purposes",
            "Delivery logs retained for 90 days",
            "Media files automatically deleted after delivery"
          ]
        },
        {
          subtitle: "Account Data",
          details: [
            "Account information retained while account is active",
            "Billing data retained for 7 years for legal compliance",
            "Usage analytics aggregated and anonymized"
          ]
        },
        {
          subtitle: "Deletion",
          details: [
            "Account deletion removes all personal data",
            "Automated deletion processes for expired data",
            "Secure data destruction procedures"
          ]
        }
      ]
    },
    {
      id: "user-rights",
      title: "Your Rights and Choices",
      icon: MdGavel,
      content: [
        {
          subtitle: "Access and Portability",
          details: [
            "Request a copy of your personal data",
            "Export your data in machine-readable format",
            "Access activity logs and usage history"
          ]
        },
        {
          subtitle: "Correction and Deletion",
          details: [
            "Update or correct your account information",
            "Request deletion of your personal data",
            "Opt-out of non-essential data processing"
          ]
        },
        {
          subtitle: "Data Protection",
          details: [
            "Object to processing for marketing purposes",
            "Restrict processing under certain circumstances",
            "Lodge complaints with data protection authorities"
          ]
        }
      ]
    }
  ];

  const quickFacts = [
    {
      fact: "We never sell your data",
      description: "Your data is never sold to third parties for marketing or any other purpose"
    },
    {
      fact: "GDPR Compliant",
      description: "Full compliance with EU data protection regulations"
    },
    {
      fact: "End-to-end Encryption",
      description: "All data encrypted in transit and at rest"
    },
    {
      fact: "User Control",
      description: "You have full control over your data and privacy settings"
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
          <div className="mb-8">
            <MdPrivacyTip className="w-20 h-20 text-[#2A8B8A] mx-auto mb-6" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
              Privacy Policy
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Learn how StitchByte collects, uses, and protects your personal information. 
            Your privacy is important to us, and we're committed to transparency.
          </p>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
            <div className="flex items-center justify-center gap-4 mb-4">
              <MdUpdate className="w-6 h-6 text-[#2A8B8A]" />
              <span className="text-lg font-semibold text-gray-900">
                Last Updated: December 15, 2024
              </span>
            </div>
            <p className="text-gray-600">
              This privacy policy is effective immediately and applies to all users of StitchByte services.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Facts */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Privacy at a Glance</h2>
            <p className="text-lg text-gray-600">Key points about how we handle your data</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickFacts.map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-lg border border-gray-100 text-center">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{item.fact}</h3>
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

      {/* Privacy Policy Content */}
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
                StitchByte ("we," "our," or "us") is committed to protecting your privacy and ensuring 
                you have a positive experience when using our WhatsApp Business API automation platform. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our services.
              </p>
              
              <p className="text-gray-600 leading-relaxed mb-6">
                By using StitchByte's services, you agree to the collection and use of information in 
                accordance with this Privacy Policy. If you do not agree with our policies and practices, 
                do not use our services.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">Important Note</h3>
                <p className="text-blue-800 text-sm leading-relaxed">
                  This Privacy Policy applies only to StitchByte's services. When messages are sent through 
                  WhatsApp, they are also subject to WhatsApp's Privacy Policy and Terms of Service.
                </p>
              </div>
            </div>
          </div>

          {/* Policy Sections */}
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
                  
                  <div className="space-y-8">
                    {section.content.map((subsection, subIndex) => (
                      <div key={subIndex} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                          {subsection.subtitle}
                        </h3>
                        <ul className="space-y-3">
                          {subsection.details.map((detail, detailIndex) => (
                            <li key={detailIndex} className="flex items-start gap-3 text-gray-600">
                              <div className="w-2 h-2 bg-[#2A8B8A] rounded-full mt-2 flex-shrink-0"></div>
                              <span className="leading-relaxed">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact Information */}
          <div className="mt-20 pt-16 border-t border-gray-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center">
                <MdContactMail className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Contact Us</h2>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <p className="text-gray-600 leading-relaxed mb-6">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our 
                data practices, please contact us using the information below:
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MdContactMail className="w-5 h-5 text-[#2A8B8A]" />
                  <span className="text-gray-900 font-semibold">Email:</span>
                  <span className="text-gray-600">privacy@stitchbyte.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MdPolicy className="w-5 h-5 text-[#2A8B8A]" />
                  <span className="text-gray-900 font-semibold">Data Protection Officer:</span>
                  <span className="text-gray-600">dpo@stitchbyte.com</span>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 text-sm leading-relaxed">
                  <strong>Response Time:</strong> We will respond to privacy-related inquiries within 30 days 
                  of receipt. For urgent matters, please mark your email as "Urgent Privacy Request."
                </p>
              </div>
            </div>
          </div>

          {/* Policy Updates */}
          <div className="mt-16 pt-16 border-t border-gray-200">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center">
                <MdUpdate className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Policy Updates</h2>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <p className="text-gray-600 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices, 
                technology, legal requirements, or other factors. When we make changes, we will:
              </p>
              
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-3 text-gray-600">
                  <div className="w-2 h-2 bg-[#2A8B8A] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Update the "Last Updated" date at the top of this policy</span>
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <div className="w-2 h-2 bg-[#2A8B8A] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Notify you via email for material changes</span>
                </li>
                <li className="flex items-start gap-3 text-gray-600">
                  <div className="w-2 h-2 bg-[#2A8B8A] rounded-full mt-2 flex-shrink-0"></div>
                  <span>Post notices on our website and dashboard</span>
                </li>
              </ul>
              
              <p className="text-gray-600 leading-relaxed">
                Your continued use of our services after any changes indicates your acceptance of the 
                updated Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#2A8B8A] via-[#238080] to-[#1e6b6b]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <MdSecurity className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">Questions About Privacy?</h2>
          <p className="text-xl text-white/90 mb-8">
            Our privacy team is here to help you understand how we protect your data 
            and answer any questions you may have.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact"
              className="bg-white text-[#2A8B8A] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Contact Privacy Team
              <MdContactMail className="w-5 h-5" />
            </Link>
            <Link 
              href="/security"
              className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-[#2A8B8A] transition-all duration-300 flex items-center justify-center gap-2"
            >
              View Security Practices
              <MdSecurity className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
