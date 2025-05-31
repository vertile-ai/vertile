import {
  Circuitry,
  Rocket,
  Lightning,
  Sparkle,
  PlusCircle,
} from '@phosphor-icons/react';

const StarterSplash = () => {
  return (
    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto px-8">
        {/* Icon with animation */}
        <div className="relative mb-8">
          <div className="mx-auto w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
            <Circuitry size={64} color="white" weight="duotone" />
          </div>

          {/* Floating sparkles */}
          <div className="absolute -top-2 -right-2 animate-bounce delay-300">
            <Sparkle size={24} color="#F59E0B" weight="fill" />
          </div>
          <div className="absolute -bottom-2 -left-2 animate-bounce delay-700">
            <Lightning size={20} color="#EF4444" weight="fill" />
          </div>
          <div className="absolute top-1/2 -right-4 animate-bounce delay-1000">
            <Rocket size={18} color="#8B5CF6" weight="fill" />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-6 leading-tight">
          Unleash the Power of
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            AI Workflows
          </span>
        </h1>

        {/* Description */}
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Transform your ideas into intelligent automation. Create powerful
          workflows that think, learn, and execute with the precision of AI
          agents.
        </p>

        {/* Features list */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Circuitry size={24} color="white" weight="bold" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">Visual Builder</h3>
            <p className="text-sm text-gray-600">
              Drag, drop, and connect nodes to build complex workflows visually
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Lightning size={24} color="white" weight="bold" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">AI-Powered</h3>
            <p className="text-sm text-gray-600">
              Leverage intelligent agents that adapt and optimize automatically
            </p>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/50">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <Rocket size={24} color="white" weight="bold" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">
              Scale Instantly
            </h3>
            <p className="text-sm text-gray-600">
              From simple tasks to enterprise automation in minutes
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button className="group relative inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-8 rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 disabled:cursor-not-allowed disabled:transform-none">
          <PlusCircle
            size={24}
            weight="bold"
            className={
              'group-hover:rotate-90 transition-transform duration-300'
            }
          />
          <span className="text-lg">Create Your First Workflow</span>

          {/* Button glow effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
        </button>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 mt-6">
          Join thousands of creators building the future with AI workflows
        </p>
      </div>
    </div>
  );
};

StarterSplash.displayName = 'StarterSplash';
export default StarterSplash;
