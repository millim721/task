import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

const App = () => {
  // State
  const [user, setUser] = useState({ role: 'guest', permissions: ['view'] });
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Initial load
  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, []);

  // Auth functions
  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        handleLogout();
      }
    } catch (error) {
      handleLogout();
    }
    setLoading(false);
  };

  const handleLogin = async (username, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) throw new Error('로그인 실패');
      
      const data = await response.json();
      localStorage.setItem('token', data.token);
      setUser(data.user);
      setShowLoginDialog(false);
      setError('');
    } catch (error) {
      setError('로그인에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser({ role: 'guest', permissions: ['view'] });
  };

  // Event functions
  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const handleAddEvent = async (eventData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...eventData,
          date: selectedDate
        })
      });

      if (response.ok) {
        fetchEvents();
        setShowEventDialog(false);
      }
    } catch (error) {
      setError('이벤트 추가에 실패했습니다.');
    }
  };

  // Login Dialog Component
  const LoginDialog = () => (
    <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>로그인</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          handleLogin(formData.get('username'), formData.get('password'));
        }} 
        className="space-y-4">
          <Input
            name="username"
            placeholder="아이디"
            required
          />
          <Input
            name="password"
            type="password"
            placeholder="비밀번호"
            required
          />
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full">로그인</Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  // Event Dialog Component
  const EventDialog = () => {
    const [formData, setFormData] = useState({
      type: 'assessment',
      title: '',
      description: '',
      assessment: {
        subject: '',
        rubric: []
      },
      classChange: {
        changeType: '교체',
        period: [],
        originalClass: '',
        newClass: ''
      }
    });

    return (
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 일정 추가</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleAddEvent(formData);
          }} 
          className="space-y-4">
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({...formData, type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="일정 유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assessment">수행평가</SelectItem>
                <SelectItem value="class-change">수업 변경</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="제목"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />

            <Input
              placeholder="설명"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />

            {formData.type === 'assessment' ? (
              <>
                <Input
                  placeholder="과목"
                  value={formData.assessment.subject}
                  onChange={(e) => setFormData({
                    ...formData,
                    assessment: {...formData.assessment, subject: e.target.value}
                  })}
                  required
                />
              </>
            ) : (
              <>
                <Select
                  value={formData.classChange.changeType}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    classChange: {...formData.classChange, changeType: value}
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="변경 유형" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="교체">수업 교체</SelectItem>
                    <SelectItem value="단축">단축 수업</SelectItem>
                    <SelectItem value="휴강">휴강</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="교시"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.classChange.period[0] || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    classChange: {
                      ...formData.classChange,
                      period: [parseInt(e.target.value)]
                    }
                  })}
                  required
                />
              </>
            )}

            <Button type="submit" className="w-full">추가</Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  // Calendar renderer
  const renderCalendar = () => {
    const daysInMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    ).getDate();

    const firstDay = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    ).getDay();

    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="p-2 border bg-gray-50" />
      );
    }

    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
      });

      days.push(
        <div
          key={day}
          className="min-h-[100px] p-2 border cursor-pointer hover:bg-gray-50"
          onClick={() => {
            setSelectedDate(date);
            if (user.permissions.includes('create')) {
              setShowEventDialog(true);
            }
          }}
        >
          <div className="flex justify-between items-start">
            <span className={date.getDay() === 0 ? 'text-red-500' : date.getDay() === 6 ? 'text-blue-500' : ''}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {dayEvents.length}
              </span>
            )}
          </div>
          <div className="mt-1">
            {dayEvents.map((event, idx) => (
              <div
                key={idx}
                className={`text-xs p-1 mb-1 rounded truncate ${
                  event.type === 'assessment' 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      Loading...
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow mb-4">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">학사 관리 시스템</h1>
          <div className="flex items-center gap-4">
            <span>
              {user.role === 'guest' ? '게스트' : 
                `${user.name} (${user.role === 'admin' ? '관리자' : '교사'})`}
            </span>
            {user.role === 'guest' ? (
              <Button variant="outline" onClick={() => setShowLoginDialog(true)}>
                로그인
              </Button>
            ) : (
              <Button variant="outline" onClick={handleLogout}>
                로그아웃
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {selectedDate.toLocaleDateString('ko-KR', { 
                year: 'numeric', 
                month: 'long' 
              })}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
              >
                이전 달
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
              >
                다음 달
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                <div key={day} className="text-center font-medium py-2">
                  {day}
                </div>
              ))}
              {renderCalendar()}
            </div>
          </CardContent>
        </Card>

        <LoginDialog />
        <EventDialog />
      </main>
    </div>
  );
};

export default App;