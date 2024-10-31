
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');  // Event 모델 import
const jwt = require('jsonwebtoken');

// 모든 이벤트 조회 (게스트도 가능)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'name role')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 새 이벤트 생성 (로그인 필요)
router.post('/', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const event = new Event({
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      createdBy: decoded.id,
      // type에 따라 다른 데이터 저장
      ...(req.body.type === 'assessment' ? {
        assessment: {
          subject: req.body.assessment.subject,
          rubric: req.body.assessment.rubric || [],
          dueDate: req.body.assessment.dueDate
        }
      } : {
        classChange: {
          changeType: req.body.classChange.changeType,
          period: req.body.classChange.period,
          originalClass: req.body.classChange.originalClass,
          newClass: req.body.classChange.newClass
        }
      })
    });

    await event.save();
    const populatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name role');
    
    res.status(201).json(populatedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 이벤트 수정 (작성자 또는 관리자만 가능)
router.put('/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: '이벤트를 찾을 수 없습니다.' });
    }

    // 작성자나 관리자만 수정 가능
    if (event.createdBy.toString() !== decoded.id && decoded.role !== 'admin') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    const updateData = {
      title: req.body.title,
      description: req.body.description,
      date: req.body.date,
      ...(req.body.type === 'assessment' ? {
        assessment: {
          subject: req.body.assessment.subject,
          rubric: req.body.assessment.rubric,
          dueDate: req.body.assessment.dueDate
        }
      } : {
        classChange: {
          changeType: req.body.classChange.changeType,
          period: req.body.classChange.period,
          originalClass: req.body.classChange.originalClass,
          newClass: req.body.classChange.newClass
        }
      })
    };

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('createdBy', 'name role');

    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 이벤트 삭제 (작성자 또는 관리자만 가능)
router.delete('/:id', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: '이벤트를 찾을 수 없습니다.' });
    }

    // 작성자나 관리자만 삭제 가능
    if (event.createdBy.toString() !== decoded.id && decoded.role !== 'admin') {
      return res.status(403).json({ error: '권한이 없습니다.' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: '이벤트가 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;