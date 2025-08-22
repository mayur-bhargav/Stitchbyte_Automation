"use client";
import Link from "next/link";
import { 
  MdArrowBack, 
  MdLocationOn, 
  MdSchedule, 
  MdWork,
  MdPeople,
  MdTrendingUp,
  MdCode,
  MdBrush,
  MdSecurity,
  MdSupport,
  MdArrowForward,
  MdCheckCircle
} from "react-icons/md";

export default function CareersPage() {
  const benefits = [
    {
      icon: MdTrendingUp,
      title: "Competitive Salary",
      description: "Industry-leading compensation with equity options",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: MdPeople,
      title: "Great Team",
      description: "Work with passionate, talented people who care",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: MdSchedule,
      title: "Flexible Hours",
      description: "Work-life balance with flexible working arrangements",
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      icon: MdLocationOn,
      title: "Remote First",
      description: "Work from anywhere with optional office access",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  const openPositions = [
    {
      id: 1,
      title: "Senior Full Stack Developer",
      department: "Engineering",
      location: "Remote / Bangalore",
      type: "Full-time",
      experience: "4+ years",
      description: "Join our engineering team to build scalable WhatsApp automation solutions. You'll work with React, Node.js, and modern cloud infrastructure.",
      requirements: [
        "4+ years of full-stack development experience",
        "Strong proficiency in React, Node.js, and TypeScript",
        "Experience with cloud platforms (AWS/GCP)",
        "Knowledge of WhatsApp Business API is a plus"
      ],
      icon: MdCode,
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      id: 2,
      title: "Product Designer",
      department: "Design",
      location: "Remote / Mumbai",
      type: "Full-time",
      experience: "3+ years",
      description: "Shape the user experience of our platform. Create intuitive interfaces that help businesses connect with their customers.",
      requirements: [
        "3+ years of product design experience",
        "Proficiency in Figma and design systems",
        "Experience with B2B SaaS products",
        "Strong understanding of user research methods"
      ],
      icon: MdBrush,
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      id: 3,
      title: "DevOps Engineer",
      department: "Infrastructure",
      location: "Remote / Hyderabad",
      type: "Full-time",
      experience: "3+ years",
      description: "Build and maintain our cloud infrastructure. Ensure our platform scales reliably as we grow.",
      requirements: [
        "3+ years of DevOps/Infrastructure experience",
        "Experience with Kubernetes and Docker",
        "Proficiency in AWS/GCP and Infrastructure as Code",
        "Strong scripting skills (Python/Bash)"
      ],
      icon: MdSecurity,
      gradient: "from-green-500 to-emerald-600"
    },
    {
      id: 4,
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote / Delhi",
      type: "Full-time",
      experience: "2+ years",
      description: "Help our customers succeed with WhatsApp automation. Build relationships and drive product adoption.",
      requirements: [
        "2+ years in customer success or account management",
        "Excellent communication and interpersonal skills",
        "Experience with B2B SaaS products",
        "Understanding of digital marketing is a plus"
      ],
      icon: MdSupport,
      gradient: "from-orange-500 to-red-600"
    },
    {
      id: 5,
      title: "Marketing Manager",
      department: "Marketing",
      location: "Remote / Pune",
      type: "Full-time",
      experience: "3+ years",
      description: "Drive our marketing strategy and growth. Create compelling campaigns that resonate with our target audience.",
      requirements: [
        "3+ years of B2B marketing experience",
        "Experience with digital marketing channels",
        "Strong analytical and creative skills",
        "Knowledge of marketing automation tools"
      ],
      icon: MdTrendingUp,
      gradient: "from-yellow-500 to-orange-600"
    }
  ];

  const values = [
    "Customer-first mindset",
    "Continuous learning and growth",
    "Transparency and open communication", 
    "Innovation and creativity",
    "Work-life balance",
    "Diversity and inclusion"
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
              Join Our Team
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Help us build the future of business communication. Join a team of passionate individuals 
            working to transform how businesses connect with their customers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="#positions"
              className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              View Open Positions
              <MdArrowForward className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Work With Us?</h2>
            <p className="text-xl text-gray-600">
              We believe in creating an environment where everyone can do their best work
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100">
                  <div className={`w-16 h-16 bg-gradient-to-r ${benefit.gradient} rounded-2xl flex items-center justify-center mb-6`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Values</h2>
            <p className="text-xl text-gray-600">
              The principles that guide how we work together
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div key={index} className="flex items-center gap-4 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                <MdCheckCircle className="w-6 h-6 text-[#2A8B8A] flex-shrink-0" />
                <span className="text-lg font-semibold text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Open Positions</h2>
            <p className="text-xl text-gray-600">
              Find your next role and help us build something amazing
            </p>
          </div>

          <div className="space-y-8">
            {openPositions.map((position) => {
              const IconComponent = position.icon;
              return (
                <div key={position.id} className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-8">
                    <div className="flex-1">
                      <div className="flex items-start gap-6 mb-6">
                        <div className={`w-16 h-16 bg-gradient-to-r ${position.gradient} rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-[#2A8B8A] transition-colors">
                            {position.title}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-1">
                              <MdWork className="w-4 h-4" />
                              {position.department}
                            </div>
                            <div className="flex items-center gap-1">
                              <MdLocationOn className="w-4 h-4" />
                              {position.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <MdSchedule className="w-4 h-4" />
                              {position.type}
                            </div>
                            <span className="bg-[#2A8B8A] text-white px-3 py-1 rounded-full text-xs font-medium">
                              {position.experience}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-6 leading-relaxed">
                        {position.description}
                      </p>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Key Requirements:</h4>
                        <ul className="space-y-2">
                          {position.requirements.map((req, index) => (
                            <li key={index} className="flex items-start gap-2 text-gray-600">
                              <MdCheckCircle className="w-5 h-5 text-[#2A8B8A] mt-0.5 flex-shrink-0" />
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="lg:w-48 flex flex-col gap-3">
                      <button className="w-full bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white py-3 px-6 rounded-xl font-semibold hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2">
                        Apply Now
                        <MdArrowForward className="w-4 h-4" />
                      </button>
                      <button className="w-full border-2 border-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:border-[#2A8B8A] hover:text-[#2A8B8A] transition-all duration-200">
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* No suitable position */}
          <div className="mt-16 text-center bg-gradient-to-br from-gray-50 to-white rounded-3xl p-12 shadow-lg border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Don't see a perfect fit?</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              We're always looking for talented individuals. Send us your resume and tell us how you'd like to contribute.
            </p>
            <Link 
              href="/contact"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              Get in Touch
              <MdArrowForward className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
