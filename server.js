const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API 配置
const FACE_API_KEY = process.env.FACE_API_KEY;
const FACE_API_SECRET = process.env.FACE_API_SECRET;
const FACE_API_URL = 'https://api-us.faceplusplus.com/facepp/v3/detect';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const LLAMA_API_KEY = process.env.LLAMA_API_KEY;
const LLAMA_API_URL = 'https://api.llama-api.com/chat/completions';

// 处理面部分析请求
app.post('/api/face-analysis', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传图片' });
        }

        const formData = new FormData();
        formData.append('api_key', FACE_API_KEY);
        formData.append('api_secret', FACE_API_SECRET);
        formData.append('image_file', req.file.buffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        });

        const response = await fetch(FACE_API_URL, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Face++ API 错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 处理天气 API 请求
app.get('/api/weather', async (req, res) => {
    try {
        const { city } = req.query;
        if (!city) {
            return res.status(400).json({ error: '请提供城市名称' });
        }

        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('天气 API 错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 处理 Llama AI API 请求
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: '请提供消息内容' });
        }

        const response = await fetch(LLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LLAMA_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-2-70b-chat",
                messages: [{ role: "user", content: message }],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        const data = await response.json();
        res.json({ response: data.choices[0].message.content });
    } catch (error) {
        console.error('Llama AI API 错误:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 启动服务器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
}); 