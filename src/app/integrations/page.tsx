"use client";
import Link from "next/link";
import { 
  MdArrowBack, 
 MdIntegrationInstructions,
  MdConnectedTv,
  MdApi,
  MdWebhook,
  MdCloudQueue,
  MdTrendingUp,
  MdBusiness,
  MdShoppingCart,
  MdSupport,
  MdAnalytics,
  MdNotifications,
  MdArrowForward,
  MdLaunch,
  MdCode,
  MdSecurity,
  MdSpeed,
  MdAutorenew
} from "react-icons/md";

export default function IntegrationsPage() {
  const featuredIntegrations = [
    {
      name: "Salesforce",
      description: "Sync contacts and leads automatically with your Salesforce CRM",
      icon: MdBusiness,
      category: "CRM",
      gradient: "from-blue-500 to-blue-600",
      status: "Available",
      features: ["Two-way sync", "Lead tracking", "Custom fields"]
    },
    {
      name: "Shopify",
      description: "Send order updates and abandoned cart reminders via WhatsApp",
      icon: MdShoppingCart,
      category: "E-commerce",
      gradient: "from-green-500 to-green-600",
      status: "Available",
      features: ["Order notifications", "Cart recovery", "Product updates"]
    },
    {
      name: "HubSpot",
      description: "Integrate with HubSpot to streamline your marketing campaigns",
      icon: MdTrendingUp,
      category: "Marketing",
      gradient: "from-orange-500 to-red-600",
      status: "Available",
      features: ["Contact sync", "Campaign tracking", "Lead scoring"]
    },
    {
      name: "Zendesk",
      description: "Provide customer support through WhatsApp within Zendesk",
      icon: MdSupport,
      category: "Support",
      gradient: "from-purple-500 to-indigo-600",
      status: "Available",
      features: ["Ticket creation", "Agent routing", "Chat history"]
    }
  ];

  const categories = [
    {
      name: "CRM & Sales",
      description: "Connect with your customer relationship management tools",
      icon: MdBusiness,
      count: 12,
      gradient: "from-blue-500 to-cyan-600",
      integrations: ["Salesforce", "HubSpot", "Pipedrive", "Zoho CRM"]
    },
    {
      name: "E-commerce",
      description: "Integrate with your online store and marketplace platforms",
      icon: MdShoppingCart,
      count: 8,
      gradient: "from-green-500 to-emerald-600",
      integrations: ["Shopify", "WooCommerce", "Magento", "BigCommerce"]
    },
    {
      name: "Analytics",
      description: "Track and analyze your WhatsApp campaign performance",
      icon: MdAnalytics,
      count: 6,
      gradient: "from-purple-500 to-indigo-600",
      integrations: ["Google Analytics", "Mixpanel", "Segment", "Amplitude"]
    },
    {
      name: "Marketing",
      description: "Enhance your marketing automation and campaigns",
      icon: MdTrendingUp,
      count: 10,
      gradient: "from-orange-500 to-red-600",
      integrations: ["Mailchimp", "Klaviyo", "ActiveCampaign", "ConvertKit"]
    },
    {
      name: "Customer Support",
      description: "Provide seamless customer service across channels",
      icon: MdSupport,
      count: 7,
      gradient: "from-teal-500 to-cyan-600",
      integrations: ["Zendesk", "Intercom", "Freshdesk", "Help Scout"]
    },
    {
      name: "Cloud Services",
      description: "Connect with cloud platforms and storage services",
      icon: MdCloudQueue,
      count: 9,
      gradient: "from-indigo-500 to-purple-600",
      integrations: ["AWS", "Google Cloud", "Azure", "Dropbox"]
    }
  ];

  const apiFeatures = [
    {
      icon: MdApi,
      title: "RESTful API",
      description: "Simple, intuitive REST API for all integrations"
    },
    {
      icon: MdWebhook,
      title: "Webhooks",
      description: "Real-time event notifications for instant updates"
    },
    {
      icon: MdSecurity,
      title: "Secure",
      description: "Enterprise-grade security with OAuth 2.0 support"
    },
    {
      icon: MdSpeed,
      title: "Fast",
      description: "High-performance endpoints with minimal latency"
    }
  ];

  const benefits = [
    {
      icon: MdAutorenew,
      title: "Automated Workflows",
      description: "Set up automated processes that save time and reduce manual work",
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      icon: MdConnectedTv,
      title: "Unified Dashboard",
      description: "Manage all your integrations from a single, intuitive interface",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      icon: MdNotifications,
      title: "Real-time Sync",
      description: "Keep your data synchronized across all platforms in real-time",
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      icon: MdCode,
      title: "Custom Integrations",
      description: "Build custom integrations using our flexible API and webhooks",
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
          <div className="mb-8">
            <MdIntegrationInstructions className="w-20 h-20 text-[#2A8B8A] mx-auto mb-6" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-gray-900 via-[#2A8B8A] to-[#238080] bg-clip-text text-transparent">
              Integrations
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Connect StitchByte with your favorite tools and platforms. 
            Streamline your workflow with powerful integrations that sync your data seamlessly.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/api-docs"
              className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              View API Docs
              <MdCode className="w-5 h-5" />
            </Link>
            <button className="border-2 border-[#2A8B8A] text-[#2A8B8A] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#2A8B8A] hover:text-white transition-all duration-300 flex items-center justify-center gap-2">
              Request Integration
              <MdLaunch className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Integrations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Featured Integrations</h2>
            <p className="text-xl text-gray-600">
              Popular integrations that work seamlessly with StitchByte
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredIntegrations.map((integration, index) => {
              const IconComponent = integration.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100 group">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-16 h-16 bg-gradient-to-r ${integration.gradient} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-right">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {integration.status}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">{integration.category}</p>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#2A8B8A] transition-colors">
                    {integration.name}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {integration.description}
                  </p>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                    <div className="flex flex-wrap gap-2">
                      {integration.features.map((feature, idx) => (
                        <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <button className="w-full bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
                    Connect {integration.name}
                    <MdArrowForward className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Integration Categories */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Integration Categories</h2>
            <p className="text-xl text-gray-600">
              Explore integrations by category to find the perfect fit for your needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/50 group cursor-pointer">
                  <div className={`w-16 h-16 bg-gradient-to-r ${category.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#2A8B8A] transition-colors">
                      {category.name}
                    </h3>
                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {category.count}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    {category.description}
                  </p>
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Popular integrations:</p>
                    <div className="flex flex-wrap gap-1">
                      {category.integrations.slice(0, 3).map((integration, idx) => (
                        <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {integration}
                        </span>
                      ))}
                      {category.integrations.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{category.integrations.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <MdArrowForward className="w-5 h-5 text-gray-400 group-hover:text-[#2A8B8A] group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* API Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Build Custom Integrations</h2>
            <p className="text-xl text-gray-600">
              Use our powerful API to create custom integrations for your specific needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {apiFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#2A8B8A] to-[#238080] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Code Example */}
          <div className="bg-gray-900 rounded-2xl p-8 overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">Example: Webhook Integration</h3>
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
            </div>
            <pre className="text-green-400 text-sm leading-relaxed overflow-x-auto">
{`// Configure webhook endpoint
POST /api/v1/webhooks/configure
{
  "url": "https://your-app.com/webhooks/stitchbyte",
  "events": ["message.delivered", "message.read", "contact.updated"],
  "secret": "your-webhook-secret"
}

// Handle incoming webhook
app.post('/webhooks/stitchbyte', (req, res) => {
  const event = req.body;
  
  switch(event.type) {
    case 'message.delivered':
      // Update delivery status in your system
      updateMessageStatus(event.data.messageId, 'delivered');
      break;
    case 'message.read':
      // Track read receipts
      trackMessageRead(event.data.messageId);
      break;
  }
  
  res.status(200).send('OK');
});`}
            </pre>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose Our Integrations?</h2>
            <p className="text-xl text-gray-600">
              Powerful benefits that streamline your workflow and boost productivity
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const IconComponent = benefit.icon;
              return (
                <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/50 group">
                  <div className={`w-16 h-16 bg-gradient-to-r ${benefit.gradient} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-[#2A8B8A] transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#2A8B8A] via-[#238080] to-[#1e6b6b]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <MdConnectedTv className="w-16 h-16 text-white mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Connect?</h2>
          <p className="text-xl text-white/90 mb-8">
            Start integrating StitchByte with your favorite tools today. 
            Join thousands of businesses streamlining their workflows.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/api-docs"
              className="bg-white text-[#2A8B8A] px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 flex items-center justify-center gap-2"
            >
              Explore API Documentation
              <MdCode className="w-5 h-5" />
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-[#2A8B8A] transition-all duration-300 flex items-center justify-center gap-2">
              Request Custom Integration
              <MdLaunch className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
