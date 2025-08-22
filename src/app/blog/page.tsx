"use client";
import Link from "next/link";
import { 
  MdArrowBack, 
  MdCalendarToday, 
  MdPerson, 
  MdTrendingUp,
  MdWhatsapp,
  MdBusiness,
  MdAnalytics,
  MdSecurity,
  MdSpeed
} from "react-icons/md";

export default function BlogPage() {
  const featuredPost = {
    id: 1,
    title: "The Future of WhatsApp Business Communication in 2025",
    excerpt: "Discover the latest trends and innovations shaping how businesses communicate with customers through WhatsApp.",
    content: "As we move further into 2025, WhatsApp Business has become the cornerstone of customer communication for businesses worldwide...",
    author: "Team StitchByte",
    date: "January 15, 2025",
    readTime: "8 min read",
    category: "Industry Insights",
    image: "/api/placeholder/800/400",
    tags: ["WhatsApp", "Business Communication", "2025 Trends"]
  };

  const blogPosts = [
    {
      id: 2,
      title: "10 WhatsApp Automation Strategies That Increased Sales by 300%",
      excerpt: "Real case studies and proven strategies from our most successful customers.",
      author: "Marketing Team",
      date: "January 10, 2025",
      readTime: "6 min read",
      category: "Case Studies",
      icon: MdTrendingUp,
      gradient: "from-green-500 to-emerald-600"
    },
    {
      id: 3,
      title: "Building Trust: Security Best Practices for WhatsApp Business",
      excerpt: "Essential security measures every business should implement for WhatsApp communication.",
      author: "Security Team",
      date: "January 8, 2025",
      readTime: "5 min read",
      category: "Security",
      icon: MdSecurity,
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      id: 4,
      title: "Analytics Deep Dive: Understanding Your WhatsApp Performance",
      excerpt: "Learn how to interpret your WhatsApp metrics and optimize your campaigns for better results.",
      author: "Product Team",
      date: "January 5, 2025",
      readTime: "7 min read",
      category: "Analytics",
      icon: MdAnalytics,
      gradient: "from-blue-500 to-cyan-600"
    },
    {
      id: 5,
      title: "Small Business Success: From 0 to 10,000 Customers with WhatsApp",
      excerpt: "How one small business used WhatsApp automation to scale from startup to success.",
      author: "Success Team",
      date: "January 3, 2025",
      readTime: "4 min read",
      category: "Success Stories",
      icon: MdBusiness,
      gradient: "from-orange-500 to-red-600"
    },
    {
      id: 6,
      title: "Speed Optimization: Making Your WhatsApp Campaigns Lightning Fast",
      excerpt: "Technical tips and tricks to optimize your WhatsApp automation for maximum speed.",
      author: "Engineering Team",
      date: "December 30, 2024",
      readTime: "5 min read",
      category: "Technical",
      icon: MdSpeed,
      gradient: "from-yellow-500 to-orange-600"
    },
    {
      id: 7,
      title: "WhatsApp Business API: Complete Integration Guide",
      excerpt: "Step-by-step guide to integrating WhatsApp Business API with your existing systems.",
      author: "Developer Team",
      date: "December 28, 2024",
      readTime: "10 min read",
      category: "Development",
      icon: MdWhatsapp,
      gradient: "from-green-600 to-teal-600"
    }
  ];

  const categories = [
    { name: "All Posts", count: 25, active: true },
    { name: "Industry Insights", count: 8 },
    { name: "Case Studies", count: 6 },
    { name: "Security", count: 4 },
    { name: "Analytics", count: 5 },
    { name: "Technical", count: 2 }
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
              StitchByte Blog
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Insights, tips, and stories about WhatsApp business automation, customer engagement, and growing your business.
          </p>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Article</h2>
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
              <div className="md:flex">
                <div className="md:w-1/2">
                  <div className="h-64 md:h-full bg-gradient-to-br from-[#2A8B8A] to-[#238080] flex items-center justify-center">
                    <div className="text-center text-white p-8">
                      <MdWhatsapp className="w-24 h-24 mx-auto mb-4 opacity-80" />
                      <h3 className="text-2xl font-bold">Featured Article</h3>
                    </div>
                  </div>
                </div>
                <div className="md:w-1/2 p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="bg-[#2A8B8A] text-white px-3 py-1 rounded-full text-sm font-medium">
                      {featuredPost.category}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 hover:text-[#2A8B8A] transition-colors cursor-pointer">
                    {featuredPost.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MdPerson className="w-4 h-4" />
                        {featuredPost.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <MdCalendarToday className="w-4 h-4" />
                        {featuredPost.date}
                      </div>
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories and Posts */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Categories */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Browse by Category</h3>
            <div className="flex flex-wrap gap-3">
              {categories.map((category, index) => (
                <button
                  key={index}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    category.active
                      ? 'bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {category.name} <span className="text-sm opacity-75">({category.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Posts */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8">Latest Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => {
                const IconComponent = post.icon;
                return (
                  <article key={post.id} className="bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-100 group">
                    <div className={`h-48 bg-gradient-to-br ${post.gradient} flex items-center justify-center relative overflow-hidden`}>
                      <IconComponent className="w-16 h-16 text-white opacity-80 group-hover:scale-110 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-300"></div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                          {post.category}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#2A8B8A] transition-colors cursor-pointer line-clamp-2">
                        {post.title}
                      </h4>
                      <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <MdPerson className="w-4 h-4" />
                          {post.author}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <MdCalendarToday className="w-4 h-4" />
                            {post.date}
                          </div>
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="bg-gradient-to-r from-[#2A8B8A] to-[#238080] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-[#238080] hover:to-[#1e6b6b] transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105">
              Load More Articles
            </button>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-20 bg-gradient-to-r from-[#2A8B8A] via-[#238080] to-[#1e6b6b]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">Stay Updated</h2>
          <p className="text-xl text-white/90 mb-8">
            Get the latest insights and tips delivered directly to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 rounded-xl border-0 focus:ring-4 focus:ring-white/20 outline-none"
            />
            <button className="bg-white text-[#2A8B8A] px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl">
              Subscribe
            </button>
          </div>
          <p className="text-white/70 text-sm mt-4">
            No spam, unsubscribe anytime. Read our privacy policy.
          </p>
        </div>
      </section>
    </div>
  );
}
