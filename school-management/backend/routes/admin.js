const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 관리자 권한 확인 미들웨어
const requireAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: '권한이 없습니다' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: '관리자 권한이 필요합니다' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: '인증 실패' });
  }
};

// 사용자 목록 조회
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 새 사용자 생성
router.post('/users', requireAdmin, async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ ...user.toJSON(), password: undefined });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 사용자 삭제
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: '마지막 관리자는 삭제할 수 없습니다' });
      }
    }

    await user.remove();
    res.json({ message: '사용자가 삭제되었습니다' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;