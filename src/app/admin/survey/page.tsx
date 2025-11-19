'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

interface SurveyStats {
  totalResponses: number;
  userTypeDistribution: Record<string, number>;
  averageHouseholdSize: number;
  expiryForgetfulnessAvg: number;
  cookingStressAvg: number;
  groceryManagementAvg: number;
  featurePreferences: Record<string, number>;
  featureRatings: Record<string, number>;
  duplicateBuyingPercentage: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<SurveyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [showCodePrompt, setShowCodePrompt] = useState(true);

  const ADMIN_CODE = process.env.NEXT_PUBLIC_SURVEY_ADMIN_CODE || 'nosh_admin_2025';

  useEffect(() => {
    const stored = localStorage.getItem('survey_admin_code');
    if (stored === ADMIN_CODE) {
      setIsAuthorized(true);
      setShowCodePrompt(false);
      fetchStats();
    }
  }, []);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminCode === ADMIN_CODE) {
      localStorage.setItem('survey_admin_code', ADMIN_CODE);
      setIsAuthorized(true);
      setShowCodePrompt(false);
      fetchStats();
    } else {
      setError('Invalid admin code');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/survey/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (showCodePrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-xl bg-white/70 rounded-3xl p-8 shadow-lg border border-white/20 max-w-md w-full"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">🔐 Admin Access</h1>
          <form onSubmit={handleCodeSubmit} className="space-y-4">
            <input
              type="password"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              placeholder="Enter admin code"
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-green-500 focus:outline-none"
            />
            {error && <p className="text-red-600 text-sm text-center">{error}</p>}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full px-4 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              Access Admin Dashboard
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Unauthorized access</p>
      </div>
    );
  }

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-red-600 text-lg">Error: {error}</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">No survey data available yet</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 p-6 md:p-12">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800">📊 Survey Analytics Dashboard</h1>
          <div className="flex gap-3 no-print">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToPDF}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold flex items-center gap-2"
            >
              📄 Export PDF
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                localStorage.removeItem('survey_admin_code');
                router.push('/dashboard');
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Logout
            </motion.button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="📝"
            label="Total Responses"
            value={stats.totalResponses}
            color="from-blue-400 to-blue-600"
          />
          <StatCard
            icon="👥"
            label="Avg Household"
            value={`${stats.averageHouseholdSize.toFixed(1)} people`}
            color="from-green-400 to-green-600"
          />
          <StatCard
            icon="😅"
            label="Forget Expiry"
            value={`${Math.round(stats.expiryForgetfulnessAvg)}/4`}
            subtitle="How often users forget expiry dates"
            color="from-yellow-400 to-yellow-600"
          />
          <StatCard
            icon="🍳"
            label="Cooking Stress"
            value={`${Math.round(stats.cookingStressAvg)}/4`}
            subtitle="Stress level when deciding what to cook"
            color="from-purple-400 to-purple-600"
          />
        </div>

        {/* User Type Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-white/70 rounded-3xl p-6 shadow-lg border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">👤 User Type Distribution</h2>
            <div className="space-y-4">
              {Object.entries(stats.userTypeDistribution).map(([type, count]) => (
                <div key={type} className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-gray-700 font-semibold mb-1">{type}</p>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(count / stats.totalResponses) * 100}%`,
                        }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                      />
                    </div>
                  </div>
                  <span className="text-gray-800 font-bold min-w-12 text-right">{count}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Feature Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-white/70 rounded-3xl p-6 shadow-lg border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 Feature Preferences</h2>
            <div className="space-y-3">
              {Object.entries(stats.featurePreferences).map(([feature, percentage]) => (
                <div key={feature} className="flex items-center justify-between p-2">
                  <span className="text-gray-700 font-semibold">{feature}</span>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-green-600 font-bold text-lg"
                  >
                    {percentage}%
                  </motion.span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Visual Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Type Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="backdrop-blur-xl bg-white/70 rounded-3xl p-6 shadow-lg border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📊 User Type Distribution</h2>
            <PieChart data={stats.userTypeDistribution} total={stats.totalResponses} />
          </motion.div>

          {/* Feature Preferences Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-white/70 rounded-3xl p-6 shadow-lg border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📈 Feature Interest Levels</h2>
            <BarChart data={stats.featurePreferences} />
          </motion.div>
        </div>

        {/* Feature Ratings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-white/70 rounded-3xl p-6 shadow-lg border border-white/20 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6">⭐ Average Feature Ratings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(stats.featureRatings).map(([feature, rating]) => (
              <motion.div
                key={feature}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-4 border border-green-100"
              >
                <p className="text-gray-800 font-semibold mb-2">{feature}</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.span
                      key={star}
                      animate={{
                        opacity: star <= rating ? 1 : 0.3,
                        scale: star <= rating ? 1.1 : 0.9,
                      }}
                      transition={{ delay: 0.4 + star * 0.05 }}
                      className="text-xl"
                    >
                      ⭐
                    </motion.span>
                  ))}
                  <span className="ml-2 text-gray-700 font-bold">{rating.toFixed(1)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Other Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="backdrop-blur-xl bg-white/70 rounded-3xl p-6 shadow-lg border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📦 Duplicate Purchases</h2>
            <div className="text-5xl font-bold text-red-600 mb-2">
              {Math.round(stats.duplicateBuyingPercentage)}%
            </div>
            <p className="text-gray-600 mb-2">Users accidentally buy duplicate items</p>
            <p className="text-sm text-gray-500 italic">Higher percentage = more users forget what they already have</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="backdrop-blur-xl bg-white/70 rounded-3xl p-6 shadow-lg border border-white/20"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🏠 Grocery Management</h2>
            <div className="text-5xl font-bold text-purple-600 mb-2">
              {Math.round(stats.groceryManagementAvg)}/4
            </div>
            <p className="text-gray-600 mb-2">Average difficulty managing groceries</p>
            <div className="mt-3 text-sm text-gray-500">
              <p>1 = Very Easy</p>
              <p>4 = Very Difficult</p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  subtitle?: string;
}

function StatCard({ icon, label, value, color, subtitle }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`backdrop-blur-xl bg-gradient-to-br ${color} rounded-2xl p-6 shadow-lg border border-white/20 text-white`}
    >
      <div className="text-4xl mb-2">{icon}</div>
      <p className="text-sm font-semibold opacity-90 mb-1">{label}</p>
      <p className="text-3xl font-bold mb-1">{value}</p>
      {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

interface PieChartProps {
  data: Record<string, number>;
  total: number;
}

function PieChart({ data, total }: PieChartProps) {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  let currentAngle = 0;

  const segments = Object.entries(data).map(([label, count], index) => {
    const percentage = (count / total) * 100;
    const angle = (percentage / 100) * 360;
    const segment = {
      label,
      count,
      percentage: Math.round(percentage),
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: colors[index % colors.length],
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-64 h-64 mb-6">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {segments.map((segment, index) => {
            const largeArc = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
            const x1 = 50 + 45 * Math.cos((segment.startAngle * Math.PI) / 180);
            const y1 = 50 + 45 * Math.sin((segment.startAngle * Math.PI) / 180);
            const x2 = 50 + 45 * Math.cos((segment.endAngle * Math.PI) / 180);
            const y2 = 50 + 45 * Math.sin((segment.endAngle * Math.PI) / 180);

            return (
              <motion.path
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={segment.color}
                stroke="white"
                strokeWidth="0.5"
              />
            );
          })}
          <circle cx="50" cy="50" r="20" fill="white" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{total}</div>
            <div className="text-xs text-gray-600">Total</div>
          </div>
        </div>
      </div>
      <div className="space-y-2 w-full">
        {segments.map((segment, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-gray-700 font-medium">{segment.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">{segment.count}</span>
              <span className="text-gray-800 font-bold">({segment.percentage}%)</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

interface BarChartProps {
  data: Record<string, number>;
}

function BarChart({ data }: BarChartProps) {
  const maxValue = Math.max(...Object.values(data));
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {Object.entries(data).map(([label, value], index) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + index * 0.1 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-gray-700 font-semibold">{label}</span>
            <span className="text-gray-900 font-bold text-lg">{value}%</span>
          </div>
          <div className="relative w-full h-8 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${value}%` }}
              transition={{ duration: 1, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
