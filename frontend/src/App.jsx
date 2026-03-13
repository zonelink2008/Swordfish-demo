// Swordfish DEMO - React前端入口
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Wallet, TrendingUp, PieChart, Activity, Settings as SettingsIcon, Menu, X, Zap, Shield, Globe } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

// API配置
const API_BASE = 'http://localhost:3000';

// 模拟钱包连接
const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      return accounts[0];
    } catch (error) {
      console.error('钱包连接失败:', error);
    }
  }
  // 模拟模式
  return '0x742d35Cc6634C0532925a3b844Bc9e7595f1234';
};

// 导航组件
function Navbar({ wallet, onConnect, mobileMenuOpen, setMobileMenuOpen }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: '仪表盘', icon: Activity },
    { path: '/trading', label: '交易', icon: TrendingUp },
    { path: '/portfolio', label: '资产', icon: PieChart },
    { path: '/market', label: '市场', icon: Globe },
    { path: '/settings', label: '设置', icon: SettingsIcon },
  ];

  return (
    <nav className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Swordfish</h1>
              <p className="text-xs text-slate-400">AI Power Trading</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                  location.pathname === item.path
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Wallet Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onConnect}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white font-medium text-sm hover:from-cyan-400 hover:to-blue-500 transition-all"
            >
              <Wallet className="w-4 h-4" />
              {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : '连接钱包'}
            </button>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-slate-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800">
          <div className="px-4 py-3 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-medium ${
                  location.pathname === item.path
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={onConnect}
              className="w-full mt-3 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg text-white font-medium"
            >
              <Wallet className="w-4 h-4 inline mr-2" />
              {wallet ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : '连接钱包'}
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// 页面内容组件
function Dashboard({ stats, predictions, loading }) {
  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="账户余额"
          value={stats?.balance || '12,450'}
          unit="JPY"
          change="+5.2%"
          positive
        />
        <StatCard
          title="今日交易"
          value={stats?.todayTrades || '23'}
          unit="笔"
          change="+12%"
          positive
        />
        <StatCard
          title="持仓收益"
          value={stats?.portfolioGain || '+1,280'}
          unit="JPY"
          change="+8.5%"
          positive
        />
        <StatCard
          title="预测准确率"
          value={stats?.predictionAccuracy || '87.3'}
          unit="%"
          change="-2.1%"
          positive={false}
        />
      </div>

      {/* 价格预测图表 */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">24小时价格预测 (JEPX)</h2>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-400">加载中...</div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="hour" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line
                  type="monotone"
                  dataKey="predictedPrice"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={false}
                  name="预测价格"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 最新订单 */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">最新订单</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-slate-400 text-sm border-b border-slate-700">
                <th className="pb-3">时间</th>
                <th className="pb-3">类型</th>
                <th className="pb-3">数量</th>
                <th className="pb-3">价格</th>
                <th className="pb-3">状态</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-700/50">
                <td className="py-3 text-slate-300">14:32</td>
                <td className="py-3 text-green-400">买入</td>
                <td className="py-3 text-white">10.5 kWh</td>
                <td className="py-3 text-white">18.5 JPY</td>
                <td className="py-3"><span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">已完成</span></td>
              </tr>
              <tr className="border-b border-slate-700/50">
                <td className="py-3 text-slate-300">14:15</td>
                <td className="py-3 text-red-400">卖出</td>
                <td className="py-3 text-white">5.0 kWh</td>
                <td className="py-3 text-white">17.2 JPY</td>
                <td className="py-3"><span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">已完成</span></td>
              </tr>
              <tr>
                <td className="py-3 text-slate-300">13:58</td>
                <td className="py-3 text-green-400">买入</td>
                <td className="py-3 text-white">8.0 kWh</td>
                <td className="py-3 text-white">16.8 JPY</td>
                <td className="py-3"><span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">处理中</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, change, positive }) {
  return (
    <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
      <p className="text-slate-400 text-sm">{title}</p>
      <div className="flex items-end gap-2 mt-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        <span className="text-slate-500 text-sm mb-1">{unit}</span>
      </div>
      <p className={`text-sm mt-2 ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {change}
      </p>
    </div>
  );
}

function Trading() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">实时交易</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {/* 买入面板 */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-green-500/30">
            <h3 className="text-green-400 font-medium mb-4">买入电力</h3>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-sm">数量 (kWh)</label>
                <input type="number" className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white" placeholder="0.00" />
              </div>
              <div>
                <label className="text-slate-400 text-sm">价格限制 (JPY/kWh)</label>
                <input type="number" className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white" placeholder="0.00" />
              </div>
              <button className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium">
                确认买入
              </button>
            </div>
          </div>
          
          {/* 卖出面板 */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-red-500/30">
            <h3 className="text-red-400 font-medium mb-4">卖出电力</h3>
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 text-sm">数量 (kWh)</label>
                <input type="number" className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white" placeholder="0.00" />
              </div>
              <div>
                <label className="text-slate-400 text-sm">价格限制 (JPY/kWh)</label>
                <input type="number" className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white" placeholder="0.00" />
              </div>
              <button className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-lg text-white font-medium">
                确认卖出
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Portfolio() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">我的资产</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">电力代币 (EPT)</p>
            <p className="text-2xl font-bold text-white mt-1">1,250.5</p>
            <p className="text-green-400 text-sm mt-1">≈ 18,750 JPY</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">治理代币 (SFT)</p>
            <p className="text-2xl font-bold text-white mt-1">500.0</p>
            <p className="text-slate-400 text-sm mt-1">≈ 2,500 JPY</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm">能源积分</p>
            <p className="text-2xl font-bold text-white mt-1">2,340</p>
            <p className="text-cyan-400 text-sm mt-1">VPP参与中</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Market() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">JEPX市场行情</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-slate-400 text-sm">日前市场均价</p>
            <p className="text-3xl font-bold text-white mt-1">18.42 <span className="text-lg font-normal">JPY/kWh</span></p>
            <p className="text-green-400 text-sm mt-1">+5.2% 较昨日</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm">当前负荷</p>
            <p className="text-3xl font-bold text-white mt-1">142.5 <span className="text-lg font-normal">GW</span></p>
            <p className="text-slate-400 text-sm mt-1">东京区域</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Settings() {
  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-4">设置</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-slate-700">
            <div>
              <p className="text-white">价格预警</p>
              <p className="text-slate-400 text-sm">价格达到设定值时通知</p>
            </div>
            <button className="px-4 py-2 bg-cyan-600 rounded-lg text-white text-sm">开启</button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-slate-700">
            <div>
              <p className="text-white">自动交易</p>
              <p className="text-slate-400 text-sm">基于AI预测自动下单</p>
            </div>
            <button className="px-4 py-2 bg-slate-700 rounded-lg text-white text-sm">关闭</button>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-white">KYC认证</p>
              <p className="text-green-400 text-sm">已认证</p>
            </div>
            <Shield className="w-5 h-5 text-green-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 主应用
function App() {
  const [wallet, setWallet] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [predRes, ordersRes, statsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/prediction/hourly`),
        axios.get(`${API_BASE}/api/orders`),
        axios.get(`${API_BASE}/api/market/stats`)
      ]);
      
      setPredictions(predRes.data.data);
      setOrders(ordersRes.data.data);
      setStats(statsRes.data.data);
    } catch (error) {
      console.error('数据获取失败:', error);
      setPredictions(generateOfflineData());
      setStats({ balance: '12,450', todayTrades: '23', portfolioGain: '+1,280', predictionAccuracy: '87.3' });
    }
    setLoading(false);
  };

  const generateOfflineData = () => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      predictedPrice: 8 + Math.random() * 15,
      period: i >= 8 && i <= 21 ? 'peak' : 'offpeak'
    }));
  };

  const handleConnect = async () => {
    const address = await connectWallet();
    setWallet(address);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
        <Navbar wallet={wallet} onConnect={handleConnect} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Routes>
            <Route path="/" element={<Dashboard stats={stats} predictions={predictions} loading={loading} />} />
            <Route path="/trading" element={<Trading />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/market" element={<Market />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
