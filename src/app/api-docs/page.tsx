"use client";
import Link from "next/link";
import { 
  MdArrowBack, 
  MdCode, 
  MdApi,
  MdIntegrationInstructions,
  MdSecurity,
  MdDescription,
  MdRocket,
  MdArrowForward,
  MdOpenInNew,
  MdDeveloperMode,
  MdWebhook,
  MdKey,
  MdCloud
} from "react-icons/md";
import { useEffect } from "react";

export default function ApiDocsPage() {
  // Auto redirect to documentation after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      window.open('http://localhost:8000/docs', '_blank');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: MdCode,
      title: "RESTful API",
      description: "Clean, intuitive REST endpoints for all WhatsApp operations",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: MdWebhook,
      title: "Real-time Webhooks",
      description: "Get instant notifications for message delivery and status updates",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: MdSecurity,
      title: "Secure Authentication",
      description: "OAuth 2.0 and API key authentication with rate limiting",
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      icon: MdCloud,
      title: "Scalable Infrastructure",
      description: "Built to handle millions of messages with 99.9% uptime",
      gradient: "from-orange-500 to-red-600"
    }
  ];

  const endpoints = [
    {
      method: "POST",
      endpoint: "/api/v1/messages/send",
      description: "Send a WhatsApp message to one or more recipients",
      methodColor: "bg-green-500"
    },
    {
      method: "GET",
      endpoint: "/api/v1/messages/{id}",
      description: "Retrieve message status and delivery information",
      methodColor: "bg-blue-500"
    },
    {
      method: "GET",
      endpoint: "/api/v1/contacts",
      description: "List all contacts with filtering and pagination",
      methodColor: "bg-blue-500"
    },
    {
      method: "POST",
      endpoint: "/api/v1/templates",
      description: "Create a new message template for approval",
      methodColor: "bg-green-500"
    },
    {
      method: "GET",
      endpoint: "/api/v1/analytics/reports",
      description: "Get detailed analytics and reporting data",
      methodColor: "bg-blue-500"
    },
    {
      method: "PUT",
      endpoint: "/api/v1/webhooks/configure",
      description: "Configure webhook endpoints for real-time events",
      methodColor: "bg-yellow-500"
    }
  ];

  const quickStart = [
    {
      step: 1,
      title: "Get API Key",
      description: "Generate your API key from the dashboard settings"
    },
    {
      step: 2,
      title: "Authenticate",
      description: "Include your API key in the Authorization header"
    },
    {
      step: 3,
      title: "Send Request",
      description: "Make your first API call to send a message"
    },
    {
      step: 4,
      title: "Handle Response",
      description: "Process the response and handle any errors"
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
            <MdCode className="w-20 h-20 text-[#2A8B8A] mx-auto mb-6" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
              API Documentation
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Integrate StitchByte's powerful WhatsApp API into your applications. 
            Build automated messaging workflows with our developer-friendly REST API.
          </p>
          
          {/* Redirect Notice */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-white/50 shadow-lg mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <MdRocket className="w-6 h-6 text-[#2A8B8A]" />
              <span className="text-lg font-semibold text-gray-900">
                Redirecting to Interactive Documentation...
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              You'll be automatically redirected to our interactive API documentation in 3 seconds.
            </p>
            <div className="flex gap-4 justify-center">
              <a 
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center gap-2"
              >
                Open Documentation Now
                <MdOpenInNew className="w-5 h-5" />
              </a>
              <button 
                onClick={() => window.open('http://localhost:8000/docs', '_blank')}
                className="border-2 border-[#2A8B8A] text-[#2A8B8A] px-6 py-3 rounded-xl font-semibold hover:bg-[#2A8B8A] hover:text-white transition-all duration-300"
              >
                View in New Tab
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>Interactive Swagger UI • Real-time testing • Complete API reference</p>
          </div>
        </div>
      </section>

      {/* API Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Powerful API Features</h2>
            <p className="text-xl text-gray-600">
              Everything you need to build WhatsApp automation into your apps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 group">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Popular Endpoints */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Popular API Endpoints</h2>
            <p className="text-xl text-gray-600">
              The most commonly used endpoints in our API
            </p>
          </div>

          <div className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 group">
                <div className="flex items-center gap-4">
                  <span className={`${endpoint.methodColor} text-white px-3 py-1 rounded-lg text-sm font-bold`}>
                    {endpoint.method}
                  </span>
                  <code className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg font-mono text-sm flex-1">
                    {endpoint.endpoint}
                  </code>
                  <MdArrowForward className="w-5 h-5 text-gray-400 group-hover:text-[#2A8B8A] group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <p className="text-gray-600 mt-3 ml-16">
                  {endpoint.description}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <a 
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-300"
            >
              View Complete API Reference
              <MdOpenInNew className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Quick Start Guide</h2>
            <p className="text-xl text-gray-600">
              Get up and running with the StitchByte API in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {quickStart.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6 mx-auto shadow-lg">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* Code Example */}
          <div className="mt-16 bg-gray-900 rounded-2xl p-8 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Example: Send a Message</h3>
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <pre className="text-green-400 text-sm leading-relaxed overflow-x-auto">
{`curl -X POST "http://localhost:8000/api/v1/messages/send" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+1234567890",
    "type": "text",
    "text": {
      "body": "Hello from StitchByte API!"
    }
  }'`}
            </pre>
          </div>
        </div>
      </section>

      {/* Developer Resources */}
      <section className="py-20 bg-gradient-to-r from-[#2A8B8A] via-[#238080] to-[#1e6b6b]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <MdDeveloperMode className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">Developer Resources</h2>
          <p className="text-xl text-white/90 mb-8">
            Everything you need to build amazing WhatsApp integrations
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a 
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 backdrop-blur-sm text-white p-6 rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <MdApi className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-bold mb-2">Interactive Docs</h3>
              <p className="text-sm opacity-90">Test API calls in real-time</p>
            </a>
            <Link 
              href="/help"
              className="bg-white/10 backdrop-blur-sm text-white p-6 rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20"
            >
              <MdDescription className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-bold mb-2">Tutorials</h3>
              <p className="text-sm opacity-90">Step-by-step guides</p>
            </Link>
            <div className="bg-white/10 backdrop-blur-sm text-white p-6 rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20">
              <MdIntegrationInstructions className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-bold mb-2">SDKs</h3>
              <p className="text-sm opacity-90">Coming soon</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
