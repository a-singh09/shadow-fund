import { Link } from "react-router-dom";
import { Shield, Twitter, MessageCircle, Github } from "lucide-react";

const Footer = () => {
  const footerSections = [
    {
      title: "ShadowFund",
      description: "Privacy-first crowdfunding powered by Avalanche",
      links: [
        { text: "About Us", route: "/about" },
        { text: "How It Works", route: "/#how-it-works" },
        { text: "Privacy Policy", route: "/privacy" },
        { text: "Terms of Service", route: "/terms" },
      ],
    },
    {
      title: "For Creators",
      links: [
        { text: "Create Campaign", route: "/create-campaign" },
        { text: "Creator Guide", route: "/guide" },
        { text: "Best Practices", route: "/best-practices" },
        { text: "Success Stories", route: "/stories" },
      ],
    },
    {
      title: "Technology",
      links: [
        { text: "Avalanche Integration", route: "/avalanche" },
        { text: "eERC20 Protocol", route: "/eerc20" },
        { text: "Smart Contracts", route: "/contracts" },
        { text: "Security Audit", route: "/security" },
      ],
    },
    {
      title: "Community",
      links: [
        {
          text: "Discord",
          url: "https://discord.gg/ShadowFund",
          external: true,
        },
        {
          text: "Twitter",
          url: "https://twitter.com/ShadowFund",
          external: true,
        },
        {
          text: "GitHub",
          url: "https://github.com/ShadowFund",
          external: true,
        },
        { text: "Blog", route: "/blog" },
      ],
    },
  ];

  const socialLinks = [
    {
      platform: "Twitter",
      icon: Twitter,
      url: "https://twitter.com/ShadowFund",
    },
    {
      platform: "Discord",
      icon: MessageCircle,
      url: "https://discord.gg/ShadowFund",
    },
    { platform: "GitHub", icon: Github, url: "https://github.com/ShadowFund" },
  ];

  return (
    <footer className="glass border-t border-white/10 mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {footerSections.map((section, index) => (
            <div key={section.title} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                {section.title}
              </h3>

              {section.description && (
                <p className="text-sm text-gray-400 mb-4">
                  {section.description}
                </p>
              )}

              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.text}>
                    {link.external ? (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-gray-400 hover:text-red-400 transition-colors duration-300"
                      >
                        {link.text}
                      </a>
                    ) : (
                      <Link
                        to={link.route || "#"}
                        className="text-sm text-gray-400 hover:text-red-400 transition-colors duration-300"
                      >
                        {link.text}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Logo and Copyright */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-red-400" />
              <span className="text-lg font-bold gradient-text">
                ShadowFund
              </span>
            </div>
            <div className="text-sm text-gray-400">
              © 2025 ShadowFund. Privacy-first crowdfunding.
            </div>
          </div>

          {/* Powered By */}
          <div className="text-sm text-gray-400">
            Powered by Avalanche eERC20
          </div>

          {/* Social Links */}
          <div className="flex items-center space-x-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-red-400 transition-colors duration-300"
                  aria-label={social.platform}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
