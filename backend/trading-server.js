/**
 * Swordfish 电力交易系统 - 后端服务
 * 支持JEPX历史数据 + AI预测
 */

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

const app = express();
app.use(cors());
app.use(express.json());

// ==================== 配置 ====================
const CONFIG = {
    // 日本电力市场参数 (基于真实JEPX数据)
    JEPX_BASE_PRICE: 12,      // 日元/kWh基础价
    JEPX_PEAK_MULTIPLIER: 1.8, // 峰值倍数
    JEPX_OFFPEAK_MULTIPLIER: 0.7, // 谷值倍数
    
    // 时间段 (日本JEPX实际高峰)
    PEAK_HOURS: [8, 9, 10, 17, 18, 19, 20, 21],  // 8-10am, 5-9pm
    OFFPEAK_HOURS: [0, 1, 2, 3, 4, 5, 22, 23],   // 深夜
    
    // 天气影响系数
    WEATHER_IMPACT: {
        sunny: 0.85,
        cloudy: 1.0,
        rainy: 1.15,
        snowy: 1.25
    },
    
    // 日本10大电力区域
    REGIONS: ['北海道', '東北', '東京', '中部', '北陸', '関西', '中国', '四国', '九州', '沖縄']
};

// ==================== 模拟JEPX历史数据 (基于2024-2025年真实价格范围) ====================
const JEPX_HISTORICAL_DATA = {
    // 2026年3月典型日价格 (JPY/kWh)
    march_typical: {
        peak_hours: [8, 9, 10, 17, 18, 19, 20, 21],
        offpeak_hours: [0, 1, 2, 3, 4, 5, 22, 23],
        // 基于真实JEPX数据的统计
        price_ranges: {
            peak: { min: 15, max: 28, avg: 21.5 },
            normal: { min: 10, max: 18, avg: 13.2 },
            offpeak: { min: 6, max: 12, avg: 8.4 }
        }
    }
};

// ==================== 价格预测模型 ====================

/**
 * 简单价格预测模型
 * 后续可替换为TensorFlow/PyTorch模型
 */
function predictPrice(hour, weather = 'cloudy', isHoliday = false) {
    let basePrice = CONFIG.JEPX_BASE_PRICE;
    
    // 时段影响
    if (CONFIG.PEAK_HOURS.includes(hour)) {
        basePrice *= CONFIG.JEPX_PEAK_MULTIPLIER;
    } else if (CONFIG.OFFPEAK_HOURS.includes(hour)) {
        basePrice *= CONFIG.JEPX_OFFPEAK_MULTIPLIER;
    }
    
    // 天气影响
    basePrice *= CONFIG.WEATHER_IMPACT[weather] || 1.0;
    
    // 节假日影响 (日本节假日通常需求下降)
    if (isHoliday) {
        basePrice *= 0.75;
    }
    
    // 随机波动 (±8%)
    const randomFactor = 1 + (Math.random() - 0.5) * 0.16;
    
    return Math.round(basePrice * randomFactor * 100) / 100;
}

/**
 * 生成24小时价格预测
 */
function generateDailyPrediction(weather = 'cloudy', isHoliday = false, region = '東京') {
    const predictions = [];
    const now = new Date();
    
    for (let hour = 0; hour < 24; hour++) {
        const price = predictPrice(hour, weather, isHoliday);
        let period = 'normal';
        
        if (CONFIG.PEAK_HOURS.includes(hour)) {
            period = 'peak';
        } else if (CONFIG.OFFPEAK_HOURS.includes(hour)) {
            period = 'offpeak';
        }
        
        predictions.push({
            hour,
            predictedPrice: price,
            period,
            region,
            timestamp: new Date(now.setHours(hour, 0, 0, 0)).toISOString()
        });
    }
    
    return predictions;
}

/**
 * 生成7天预测 (小时粒度)
 */
function generateWeeklyPrediction() {
    const predictions = [];
    const now = new Date();
    
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            const isWeekend = (now.getDay() + day) % 7 >= 5;
            const isHoliday = isWeekend && Math.random() > 0.7;
            const weather = ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)];
            
            predictions.push({
                day,
                hour,
                predictedPrice: predictPrice(hour, weather, isHoliday),
                period: CONFIG.PEAK_HOURS.includes(hour) ? 'peak' : 
                        CONFIG.OFFPEAK_HOURS.includes(hour) ? 'offpeak' : 'normal'
            });
        }
    }
    
    return predictions;
}

// ==================== 订单管理 ====================
let orderBook = [];

// 初始化模拟订单
function initializeOrderBook() {
    const sellers = [
        '0x742d35Cc6634C0532925a3b844Bc9e7595f',
        '0x1234567890abcdef1234567890abcdef12345678',
        '0xA1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8'
    ];
    const buyers = [
        '0xabcdef1234567890abcdef1234567890abcd',
        '0x1111111111111111111111111111111111111111',
        '0xDEADBEEF1234567890abcdef1234567890abcd'
    ];
    
    orderBook = [];
    for (let i = 0; i < 30; i++) {
        const hour = Math.floor(Math.random() * 24);
        const isBuy = Math.random() > 0.5;
        
        orderBook.push({
            orderId: i + 1,
            type: isBuy ? 'buy' : 'sell',
            seller: isBuy ? null : sellers[Math.floor(Math.random() * sellers.length)],
            buyer: isBuy ? buyers[Math.floor(Math.random() * buyers.length)] : null,
            energyKWh: Math.floor(Math.random() * 100) + 5,
            pricePerKWh: predictPrice(hour),
            deliveryTime: Date.now() + hour * 3600000,
            status: Math.random() > 0.3 ? 'filled' : 'active',
            createdAt: Date.now() - Math.random() * 86400000
        });
    }
    
    // 按时间排序
    orderBook.sort((a, b) => b.createdAt - a.createdAt);
}

initializeOrderBook();

// ==================== API路由 ====================

// 1. 获取24小时价格预测
app.get('/api/prediction/hourly', (req, res) => {
    const { weather, holiday, region } = req.query;
    const prediction = generateDailyPrediction(weather, holiday === 'true', region || '東京');
    
    res.json({
        success: true,
        data: prediction,
        meta: {
            weather: weather || 'cloudy',
            holiday: holiday === 'true',
            region: region || '東京',
            generatedAt: new Date().toISOString()
        }
    });
});

// 2. 获取7天预测
app.get('/api/prediction/weekly', (req, res) => {
    const prediction = generateWeeklyPrediction();
    
    res.json({
        success: true,
        data: prediction,
        meta: {
            days: 7,
            hourlyGranularity: true,
            generatedAt: new Date().toISOString()
        }
    });
});

// 3. 获取特定时段预测
app.get('/api/prediction/:hour', (req, res) => {
    const hour = parseInt(req.params.hour);
    const { weather } = req.query;
    
    if (hour < 0 || hour > 23) {
        return res.status(400).json({ error: 'Invalid hour (0-23)' });
    }
    
    const price = predictPrice(hour, weather);
    
    res.json({
        success: true,
        data: {
            hour,
            predictedPrice: price,
            period: CONFIG.PEAK_HOURS.includes(hour) ? 'peak' : 
                    CONFIG.OFFPEAK_HOURS.includes(hour) ? 'offpeak' : 'normal'
        }
    });
});

// 4. 获取订单簿
app.get('/api/orders', (req, res) => {
    const { type, status, limit } = req.query;
    
    let filtered = [...orderBook];
    
    if (type) filtered = filtered.filter(o => o.type === type);
    if (status) filtered = filtered.filter(o => o.status === status);
    if (limit) filtered = filtered.slice(0, parseInt(limit));
    
    res.json({
        success: true,
        data: filtered,
        meta: {
            total: orderBook.length,
            filtered: filtered.length
        }
    });
});

// 5. 创建订单
app.post('/api/orders', (req, res) => {
    const { type, energyKWh, pricePerKWh } = req.body;
    
    const order = {
        orderId: orderBook.length + 1,
        type: type || 'sell',
        seller: type === 'buy' ? null : '0x742d35Cc6634C0532925a3b844Bc9e7595f',
        buyer: type === 'buy' ? '0x742d35Cc6634C0532925a3b844Bc9e7595f' : null,
        energyKWh: energyKWh || 50,
        pricePerKWh: pricePerKWh || CONFIG.JEPX_BASE_PRICE,
        deliveryTime: Date.now() + 3600000,
        status: 'active',
        createdAt: Date.now()
    };
    
    orderBook.unshift(order);
    
    res.json({
        success: true,
        data: order,
        message: 'Order created successfully'
    });
});

// 6. 获取市场统计
app.get('/api/market/stats', (req, res) => {
    const now = new Date();
    const hour = now.getHours();
    const prediction = generateDailyPrediction();
    
    const prices = prediction.map(p => p.predictedPrice);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    // 计算活跃订单
    const activeOrders = orderBook.filter(o => o.status === 'active');
    const buyOrders = activeOrders.filter(o => o.type === 'buy');
    const sellOrders = activeOrders.filter(o => o.type === 'sell');
    
    res.json({
        success: true,
        data: {
            currentHour: hour,
            currentPrice: predictPrice(hour),
            averagePrice: Math.round(avgPrice * 100) / 100,
            maxPrice: Math.max(...prices),
            minPrice: Math.min(...prices),
            priceRange: {
                peak: { min: 15, max: 28 },
                normal: { min: 10, max: 18 },
                offpeak: { min: 6, max: 12 }
            },
            orders: {
                total: orderBook.length,
                active: activeOrders.length,
                buy: buyOrders.length,
                sell: sellOrders.length
            },
            totalVolume: Math.floor(Math.random() * 50000) + 10000, // MWh (模拟)
            region: '東京'
        },
        timestamp: new Date().toISOString()
    });
});

// 7. 获取JEPX区域价格
app.get('/api/market/regions', (req, res) => {
    const regions = CONFIG.REGIONS.map(region => {
        const baseMultiplier = region === '東京' ? 1.0 : 0.9 + Math.random() * 0.2;
        
        return {
            name: region,
            currentPrice: Math.round(CONFIG.JEPX_BASE_PRICE * baseMultiplier * 100) / 100,
            demandGW: Math.round((50 + Math.random() * 100) * 10) / 10,
            supplyGW: Math.round((55 + Math.random() * 100) * 10) / 10,
            supplyDemandRatio: Math.round((0.9 + Math.random() * 0.3) * 100) / 100
        };
    });
    
    res.json({
        success: true,
        data: regions,
        timestamp: new Date().toISOString()
    });
});

// 8. 获取历史价格数据 (模拟)
app.get('/api/market/history', (req, res) => {
    const { days = 30 } = req.query;
    const history = [];
    
    for (let d = parseInt(days); d >= 0; d--) {
        const date = new Date();
        date.setDate(date.getDate() - d);
        
        for (let hour = 0; hour < 24; hour++) {
            history.push({
                date: date.toISOString().split('T')[0],
                hour,
                price: predictPrice(hour),
                volume: Math.floor(Math.random() * 5000) + 1000
            });
        }
    }
    
    res.json({
        success: true,
        data: history,
        meta: { days: parseInt(days) }
    });
});

// 9. 健康检查
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        service: 'Swordfish Trading API',
        version: '1.0.0',
        timestamp: new Date().toISOString() 
    });
});

// ==================== 启动服务器 ====================
const PORT = process.env.PORT || 3000;

const server = createServer(app);

server.listen(PORT, () => {
    console.log(`
⚔️  Swordfish 电力交易服务
━━━━━━━━━━━━━━━━━━━━━━
📡 服务运行: http://localhost:${PORT}
📊 API端点:
   GET  /api/prediction/hourly   - 24小时预测
   GET  /api/prediction/weekly  - 7天预测
   GET  /api/prediction/:hour   - 特定时段
   GET  /api/orders             - 订单簿
   POST /api/orders             - 创建订单
   GET  /api/market/stats       - 市场统计
   GET  /api/market/regions     - 区域价格
   GET  /api/market/history     - 历史数据
   GET  /api/health             - 健康检查
━━━━━━━━━━━━━━━━━━━━━━
    `);
});

export default app;
