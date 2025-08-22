"use client";
import Link from "next/link";
import { 
  MdArrowBack, 
  MdSecurity,
  MdLock,
  MdShield,
  MdVerifiedUser,
  MdPrivacyTip,
  MdCloud,
  MdKey,
  MdMonitorHeart,
  MdGppGood,
  MdPolicy,
  MdFingerprint,
  MdVpnKey,
  MdNoEncryption,
  MdBackup,
  MdAudiotrack,
  MdNotificationImportant,
  MdCheckCircle
} from "react-icons/md";

export default function SecurityPage() {
  const securityFeatures = [
    {
      icon: MdNoEncryption,
      title: "End-to-End Encryption",
      description: "All data is encrypted in transit and at rest using AES-256 encryption standards",
      details: [
        "TLS 1.3 for data in transit",
        "AES-256 encryption for data at rest",
        "Encrypted database storage",
        "Secure key management"
      ],
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: MdVpnKey,
      title: "OAuth 2.0 Authentication",
      description: "Secure authentication with industry-standard OAuth 2.0 and API key management",
      details: [
        "Multi-factor authentication",
        "API key rotation",
        "Session management",
        "Access token security"
      ],
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: MdShield,
      title: "Network Security",
      description: "Advanced network protection with DDoS mitigation and firewall systems",
      details: [
        "DDoS protection",
        "Web application firewall",
        "IP whitelisting",
        "Rate limiting"
      ],
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      icon: MdBackup,
      title: "Data Backup & Recovery",
      description: "Automated backups with point-in-time recovery and disaster recovery plans",
      details: [
        "Daily automated backups",
        "Point-in-time recovery",
        "Geographic redundancy",
        "Disaster recovery testing"
      ],
      gradient: "from-orange-500 to-red-600"
    }
  ];

  const compliance = [
    {
      name: "SOC 2 Type II",
      description: "Annual SOC 2 Type II audits ensuring security, availability, and confidentiality",
      status: "Certified",
      icon: MdVerifiedUser,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      name: "GDPR Compliant",
      description: "Full compliance with EU General Data Protection Regulation requirements",
      status: "Compliant",
      icon: MdPolicy,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      name: "ISO 27001",
      description: "Information security management system certification in progress",
      status: "In Progress",
      icon: MdGppGood,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      name: "WhatsApp Business",
      description: "Certified WhatsApp Business Solution Provider with security requirements",
      status: "Certified",
      icon: MdCheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-100"
    }
  ];

  const securityPractices = [
    {
      title: "Security Monitoring",
      description: "24/7 security monitoring with automated threat detection and response",
      icon: MdMonitorHeart,
      features: [
        "Real-time threat detection",
        "Security incident response",
        "Automated vulnerability scanning",
        "Security information and event management (SIEM)"
      ]
    },
    {
      title: "Access Controls",
      description: "Strict access controls and identity management for all systems",
      icon: MdFingerprint,
      features: [
        "Role-based access control (RBAC)",
        "Principle of least privilege",
        "Regular access reviews",
        "Privileged access management"
      ]
    },
    {
      title: "Security Audits",
      description: "Regular security audits and penetration testing by third-party experts",
      icon: MdAudiotrack,
      features: [
        "Annual penetration testing",
        "Code security reviews",
        "Vulnerability assessments",
        "Security policy audits"
      ]
    },
    {
      title: "Incident Response",
      description: "Comprehensive incident response plan with defined procedures and timelines",
      icon: MdNotificationImportant,
      features: [
        "24-hour incident response",
        "Security incident classification",
        "Customer notification procedures",
        "Post-incident analysis"
      ]
    }
  ];

  const dataProtection = [
    {
      category: "Data Collection",
      description: "We only collect data necessary for service functionality",
      measures: [
        "Minimal data collection",
        "Purpose limitation",
        "Data minimization",
        "Consent management"
      ]
    },
    {
      category: "Data Storage",
      description: "Secure storage with encryption and access controls",
      measures: [
        "Encrypted storage",
        "Access logging",
        "Data retention policies",
        "Secure deletion"
      ]
    },
    {
      category: "Data Processing",
      description: "Lawful processing with user consent and transparency",
      measures: [
        "Lawful basis for processing",
        "User consent management",
        "Processing records",
        "Data subject rights"
      ]
    },
    {
      category: "Data Sharing",
      description: "Controlled sharing with authorized parties only",
      measures: [
        "Third-party agreements",
        "Data sharing logs",
        "User control",
        "Transparency reports"
      ]
    }
  ];

  const securityBestPractices = [
    {
      title: "Use Strong API Keys",
      description: "Generate and use strong, unique API keys for your integrations",
      recommendation: "Rotate API keys regularly and never expose them in client-side code"
    },
    {
      title: "Implement Rate Limiting",
      description: "Implement proper rate limiting to prevent abuse of your endpoints",
      recommendation: "Use our recommended rate limits and implement exponential backoff"
    },
    {
      title: "Validate Webhooks",
      description: "Always validate webhook signatures to ensure authenticity",
      recommendation: "Use the provided webhook secret to verify incoming webhooks"
    },
    {
      title: "Monitor API Usage",
      description: "Regularly monitor your API usage for unusual patterns",
      recommendation: "Set up alerts for unexpected spikes in API calls or failed requests"
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
            <MdSecurity className="w-20 h-20 text-[#2A8B8A] mx-auto mb-6" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
              Security & Privacy
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Your data security and privacy are our top priorities. Learn about our comprehensive 
            security measures, compliance standards, and privacy protection practices.
          </p>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg">
            <div className="flex items-center justify-center gap-4 mb-4">
              <MdShield className="w-8 h-8 text-green-600" />
              <span className="text-lg font-semibold text-gray-900">
                Enterprise-Grade Security
              </span>
            </div>
            <p className="text-gray-600">
              Bank-level encryption • SOC 2 certified • GDPR compliant • 24/7 monitoring
            </p>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Security Features</h2>
            <p className="text-xl text-gray-600">
              Comprehensive security measures protecting your data at every level
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#2A8B8A] transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                        <MdCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Compliance & Certifications */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Compliance & Certifications</h2>
            <p className="text-xl text-gray-600">
              Meeting and exceeding industry standards for security and privacy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {compliance.map((cert, index) => {
              const IconComponent = cert.icon;
              return (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${cert.bgColor}`}>
                      <IconComponent className={`w-6 h-6 ${cert.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {cert.name}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cert.bgColor} ${cert.color}`}>
                          {cert.status}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {cert.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security Practices */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Security Practices</h2>
            <p className="text-xl text-gray-600">
              Our comprehensive approach to maintaining the highest security standards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {securityPractices.map((practice, index) => {
              const IconComponent = practice.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-2xl flex items-center justify-center mb-6">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {practice.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {practice.description}
                  </p>
                  <ul className="space-y-2">
                    {practice.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-gray-600">
                        <MdCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Data Protection */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Data Protection</h2>
            <p className="text-xl text-gray-600">
              How we protect your data throughout its lifecycle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dataProtection.map((category, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {category.category}
                </h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                  {category.description}
                </p>
                <ul className="space-y-2">
                  {category.measures.map((measure, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-gray-600">
                      <MdCheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                      {measure}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Best Practices for Users */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Security Best Practices</h2>
            <p className="text-xl text-gray-600">
              Recommendations to keep your StitchByte integration secure
            </p>
          </div>

          <div className="space-y-6">
            {securityBestPractices.map((practice, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-xl flex items-center justify-center flex-shrink-0">
                    <MdLock className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {practice.title}
                    </h3>
                    <p className="text-gray-600 mb-3 leading-relaxed">
                      {practice.description}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-800 text-sm">
                        <strong>Recommendation:</strong> {practice.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Security Team */}
      <section className="py-20 bg-gradient-to-r from-[#2A8B8A] via-[#238080] to-[#1e6b6b]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <MdPrivacyTip className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">Security Questions?</h2>
          <p className="text-xl text-white/90 mb-8">
            Have security questions or want to report a vulnerability? 
            Our security team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/contact"
              className="bg-white text-[#2A8B8A] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Contact Security Team
              <MdSecurity className="w-5 h-5" />
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-[#2A8B8A] transition-all duration-300 flex items-center justify-center gap-2">
              Report Vulnerability
              <MdNotificationImportant className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/70 text-sm mt-6">
            For security vulnerabilities, please email: security@stitchbyte.com
          </p>
        </div>
      </section>
    </div>
  );
}
